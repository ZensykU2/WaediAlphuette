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

  // ── Dialogs ───────────────────────────────────────────────
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // ── Window Controls ───────────────────────────────────────
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
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
