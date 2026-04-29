import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'

// Configure logging
autoUpdater.logger = log
// @ts-ignore
autoUpdater.logger.transports.file.level = 'info'

export function initUpdater(mainWindow: BrowserWindow) {
  // Check for updates every time the app starts
  autoUpdater.checkForUpdatesAndNotify()

  // Notify renderer when an update is available
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available')
  })

  // Notify renderer when update is downloaded and ready to install
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })

  // IPC handler to quit and install the update
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
  })
}
