import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAllHandlers } from '../ipc/handlers'
import { initDatabase } from '../db/database'
import { getActiveSaison, createWeekSnapshot } from '../db/database'

// Pending snapshot notification to send once the renderer is ready
let pendingSnapshot: { typ: string; woche: string } | null = null

/**
 * Checks the current day on startup and auto-creates a weekly snapshot:
 * - Monday  → 'start' snapshot
 * - Sunday  → 'ende'  snapshot
 * Safe to call multiple times (INSERT OR IGNORE in DB).
 */
function checkAndCreateAutoSnapshot(): void {
  try {
    const saison = getActiveSaison() as any
    if (!saison) return

    const today = new Date()
    const dow = today.getDay() // 0=Sun, 1=Mon … 6=Sat
    if (dow !== 1 && dow !== 0) return

    // Compute the ISO date of Monday for this week
    const monday = new Date(today)
    const daysFromMonday = dow === 0 ? 6 : 0
    monday.setDate(today.getDate() - daysFromMonday)
    const wocheMontag = monday.toISOString().split('T')[0]

    const typ: 'start' | 'ende' = dow === 1 ? 'start' : 'ende'
    const created = createWeekSnapshot(saison.id, wocheMontag, typ)

    if (created) {
      pendingSnapshot = { typ, woche: wocheMontag }
    }
  } catch (e) {
    // Non-fatal — snapshot is a best-effort operation
    console.warn('[AutoSnapshot] Failed:', e)
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    backgroundColor: '#1a1c14',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Send pending auto-snapshot notification once the page is loaded
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingSnapshot) {
      mainWindow.webContents.send('getraenke:snapshotCreated', pendingSnapshot)
      pendingSnapshot = null
    }
  })

  // Notify renderer when maximize state changes (for dynamic icon)
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximizeChange', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximizeChange', false)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // IPC handlers for window controls
  ipcMain.on('window-minimize', () => mainWindow.minimize())

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => mainWindow.close())

  ipcMain.handle('window:isMaximized', () => mainWindow.isMaximized())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('ch.waedi.alphuette')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initDatabase()
  registerAllHandlers()

  // Auto-snapshot runs after DB is ready, before window is shown
  checkAndCreateAutoSnapshot()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
