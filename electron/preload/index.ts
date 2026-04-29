import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Typed API surface exposed to renderer via window.api
const api = {
  // ── Saisons ──────────────────────────────────────────────
  getSaisons: () => ipcRenderer.invoke('saisons:getAll'),
  createSaison: (data: unknown) => ipcRenderer.invoke('saisons:create', data),
  updateSaison: (id: number, data: unknown) => ipcRenderer.invoke('saisons:update', id, data),
  deleteSaison: (id: number) => ipcRenderer.invoke('saisons:delete', id),
  setActiveSaison: (id: number) => ipcRenderer.invoke('saisons:setActive', id),

  // ── Einnahmen ─────────────────────────────────────────────
  getEinnahmen: (filter: unknown) => ipcRenderer.invoke('einnahmen:getAll', filter),
  addEinnahme: (entry: unknown) => ipcRenderer.invoke('einnahmen:add', entry),
  updateEinnahme: (id: number, data: unknown) => ipcRenderer.invoke('einnahmen:update', id, data),
  deleteEinnahme: (id: number) => ipcRenderer.invoke('einnahmen:delete', id),

  // ── Ausgaben ──────────────────────────────────────────────
  getAusgaben: (filter: unknown) => ipcRenderer.invoke('ausgaben:getAll', filter),
  addAusgabe: (entry: unknown) => ipcRenderer.invoke('ausgaben:add', entry),
  updateAusgabe: (id: number, data: unknown) => ipcRenderer.invoke('ausgaben:update', id, data),
  deleteAusgabe: (id: number) => ipcRenderer.invoke('ausgaben:delete', id),

  // ── Budget ────────────────────────────────────────────────
  getBudgetPlan: (saisonId: number) => ipcRenderer.invoke('budget:get', saisonId),
  saveBudgetPlan: (items: unknown) => ipcRenderer.invoke('budget:save', items),

  // ── Reporting ─────────────────────────────────────────────
  getDashboardStats: (saisonId: number) => ipcRenderer.invoke('reporting:dashboard', saisonId),
  getTagesauswertung: (datum: string, saisonId: number) =>
    ipcRenderer.invoke('reporting:tag', datum, saisonId),
  getWochenauswertung: (weekStart: string, saisonId: number) =>
    ipcRenderer.invoke('reporting:woche', weekStart, saisonId),
  getGesamtauswertung: (saisonId: number) => ipcRenderer.invoke('reporting:gesamt', saisonId),

  // ── Excel ─────────────────────────────────────────────────
  importExcel: (filePath: string) => ipcRenderer.invoke('excel:import', filePath),
  exportExcel: (saisonId: number, filePath: string) =>
    ipcRenderer.invoke('excel:export', saisonId, filePath),

  // ── Getränke ──────────────────────────────────────────────
  getGetraenkeStammdaten: () => ipcRenderer.invoke('getraenke:getStammdaten'),
  saveGetraenkStammdat: (drink: unknown) => ipcRenderer.invoke('getraenke:saveStammdat', drink),
  deleteGetraenkStammdat: (id: number) => ipcRenderer.invoke('getraenke:deleteStammdat', id),
  getGetraenkeAbrechnung: (saisonId: number) =>
    ipcRenderer.invoke('getraenke:getAbrechnung', saisonId),
  saveGetraenkeAbrechnung: (saisonId: number, data: unknown) =>
    ipcRenderer.invoke('getraenke:saveAbrechnung', saisonId, data),
  exportGetraenkeExcel: (saisonId: number, filePath: string, date?: string) =>
    ipcRenderer.invoke('getraenke:exportExcel', saisonId, filePath, date),
  getGetraenkeBookingStatus: (saisonId: number) =>
    ipcRenderer.invoke('getraenke:getBookingStatus', saisonId),
  bookGetraenkeRevenue: (saisonId: number, amount: number) =>
    ipcRenderer.invoke('getraenke:bookRevenue', saisonId, amount),
  unbookGetraenkeRevenue: (saisonId: number) =>
    ipcRenderer.invoke('getraenke:unbookRevenue', saisonId),

  // ── Wochen-Snapshots ──────────────────────────────────────
  getWeekSnapshotList: (saisonId: number) =>
    ipcRenderer.invoke('getraenke:getWeekSnapshotList', saisonId),
  getWeekSnapshot: (saisonId: number, wocheMontag: string, typ: 'start' | 'ende') =>
    ipcRenderer.invoke('getraenke:getWeekSnapshot', saisonId, wocheMontag, typ),
  exportWeekGetraenkeExcel: (saisonId: number, filePath: string, wocheMontag: string) =>
    ipcRenderer.invoke('getraenke:exportWeekExcel', saisonId, filePath, wocheMontag),

  // ── Dialogs ───────────────────────────────────────────────
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // ── Window Controls ───────────────────────────────────────
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Returns current maximized state (one-time query)
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  // Subscribe to maximize/unmaximize events. Returns an unsubscribe function.
  onMaximizeChange: (cb: (isMaximized: boolean) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, val: boolean) => cb(val)
    ipcRenderer.on('window:maximizeChange', listener)
    return () => ipcRenderer.removeListener('window:maximizeChange', listener)
  },

  // Subscribe to auto-snapshot creation events. Returns an unsubscribe function.
  onSnapshotCreated: (cb: (data: { typ: string; woche: string }) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { typ: string; woche: string }) => cb(data)
    ipcRenderer.on('getraenke:snapshotCreated', listener)
    return () => ipcRenderer.removeListener('getraenke:snapshotCreated', listener)
  },

  // ── Auto-Updater ──────────────────────────────────────────
  onUpdateAvailable: (cb: () => void): (() => void) => {
    const listener = () => cb()
    ipcRenderer.on('update-available', listener)
    return () => ipcRenderer.removeListener('update-available', listener)
  },
  onUpdateDownloaded: (cb: () => void): (() => void) => {
    const listener = () => cb()
    ipcRenderer.on('update-downloaded', listener)
    return () => ipcRenderer.removeListener('update-downloaded', listener)
  },
  installUpdate: () => ipcRenderer.send('install-update')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (for non-sandboxed contexts in dev)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
