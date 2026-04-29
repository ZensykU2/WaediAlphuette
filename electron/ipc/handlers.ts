import { ipcMain, dialog } from 'electron'
import {
  getAllSaisons, createSaison, updateSaison, deleteSaison,
  setActiveSaison, getEinnahmen, addEinnahme, updateEinnahme,
  deleteEinnahme, getAusgaben, addAusgabe, updateAusgabe,
  deleteAusgabe, getBudgetPlan, saveBudgetPlan, getDashboardStats,
  getTagesauswertung, getWochenauswertung, getGesamtauswertung,
  getGetraenkeStammdaten, saveGetraenkStammdat, deleteGetraenkStammdat,
  getGetraenkeAbrechnung, saveGetraenkeAbrechnung,
  getGetraenkeBookingStatus, bookGetraenkeRevenue, unbookGetraenkeRevenue,
  getWeekSnapshotList, getWeekSnapshot
} from '../db/database'
import { importExcel, exportExcel, exportDrinksExcel, exportDrinksWeekExcel } from '../excel/excel'

export function registerAllHandlers(): void {
  // ── Saisons ──────────────────────────────────────────────
  ipcMain.handle('saisons:getAll',   () => getAllSaisons())
  ipcMain.handle('saisons:create',   (_, data) => createSaison(data))
  ipcMain.handle('saisons:update',   (_, id, data) => updateSaison(id, data))
  ipcMain.handle('saisons:delete',   (_, id) => deleteSaison(id))
  ipcMain.handle('saisons:setActive',(_, id) => setActiveSaison(id))

  // ── Einnahmen ─────────────────────────────────────────────
  ipcMain.handle('einnahmen:getAll', (_, filter) => getEinnahmen(filter ?? {}))
  ipcMain.handle('einnahmen:add',    (_, entry) => addEinnahme(entry))
  ipcMain.handle('einnahmen:update', (_, id, data) => updateEinnahme(id, data))
  ipcMain.handle('einnahmen:delete', (_, id) => deleteEinnahme(id))

  // ── Ausgaben ──────────────────────────────────────────────
  ipcMain.handle('ausgaben:getAll',  (_, filter) => getAusgaben(filter ?? {}))
  ipcMain.handle('ausgaben:add',     (_, entry) => addAusgabe(entry))
  ipcMain.handle('ausgaben:update',  (_, id, data) => updateAusgabe(id, data))
  ipcMain.handle('ausgaben:delete',  (_, id) => deleteAusgabe(id))

  // ── Budget ────────────────────────────────────────────────
  ipcMain.handle('budget:get',  (_, saisonId) => getBudgetPlan(saisonId))
  ipcMain.handle('budget:save', (_, items) => saveBudgetPlan(items))

  // ── Reporting ─────────────────────────────────────────────
  ipcMain.handle('reporting:dashboard', (_, saisonId) => getDashboardStats(saisonId))
  ipcMain.handle('reporting:tag',       (_, datum, saisonId) => getTagesauswertung(datum, saisonId))
  ipcMain.handle('reporting:woche',     (_, weekStart, saisonId) => getWochenauswertung(weekStart, saisonId))
  ipcMain.handle('reporting:gesamt',    (_, saisonId) => getGesamtauswertung(saisonId))

  // ── Excel ─────────────────────────────────────────────────
  ipcMain.handle('excel:import', async (_, filePath: string) => {
    return await importExcel(filePath)
  })
  ipcMain.handle('excel:export', async (_, saisonId: number, filePath: string, date?: string) => {
    return await exportExcel(saisonId, filePath, date)
  })

  // ── Getränke ──────────────────────────────────────────────
  ipcMain.handle('getraenke:getStammdaten', () => getGetraenkeStammdaten())
  ipcMain.handle('getraenke:saveStammdat',  (_, drink) => saveGetraenkStammdat(drink))
  ipcMain.handle('getraenke:deleteStammdat',(_, id) => deleteGetraenkStammdat(id))
  ipcMain.handle('getraenke:getAbrechnung', (_, saisonId) => getGetraenkeAbrechnung(saisonId))
  ipcMain.handle('getraenke:saveAbrechnung',(_, saisonId, data) => saveGetraenkeAbrechnung(saisonId, data))
  ipcMain.handle('getraenke:exportExcel',  (_, saisonId: number, filePath: string, date?: string) => exportDrinksExcel(saisonId, filePath, date))
  ipcMain.handle('getraenke:getBookingStatus', (_, saisonId) => getGetraenkeBookingStatus(saisonId))
  ipcMain.handle('getraenke:bookRevenue',      (_, saisonId, amount) => bookGetraenkeRevenue(saisonId, amount))
  ipcMain.handle('getraenke:unbookRevenue',    (_, saisonId) => unbookGetraenkeRevenue(saisonId))

  // ── Wochen-Snapshots ──────────────────────────────────────
  ipcMain.handle('getraenke:getWeekSnapshotList', (_, saisonId) => getWeekSnapshotList(saisonId))
  ipcMain.handle('getraenke:getWeekSnapshot',     (_, saisonId, wocheMontag, typ) => getWeekSnapshot(saisonId, wocheMontag, typ))
  ipcMain.handle('getraenke:exportWeekExcel', async (_, saisonId: number, filePath: string, wocheMontag: string) => {
    return await exportDrinksWeekExcel(saisonId, filePath, wocheMontag)
  })

  // ── File Dialogs ──────────────────────────────────────────
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:saveFile', async (_, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    return result.canceled ? null : result.filePath
  })
}
