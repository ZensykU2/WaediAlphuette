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
  getWeekSnapshotList, getWeekSnapshot,
  // New modules
  getAllHelfer, saveHelfer, deleteHelfer,
  getEinsaetze, saveEinsatz, deleteEinsatz,
  getAllZimmer, getZimmerBelegung, saveZimmerBelegung, deleteZimmerBelegung,
  getAnlaesse, saveAnlass, deleteAnlass,
  getMenue, saveMenue,
  getEinkaufsliste, saveEinkaufsitem, toggleEinkaufsitemBesorgt, deleteEinkaufsitem,
  getAllRezepte, saveRezept, saveRezeptZutaten, getRezeptZutaten, deleteRezept,
  getTodos, saveTodo, deleteTodo,
  getLearnings, saveLearning, deleteLearning
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

  ipcMain.handle('dialog:openPdf', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // ── Helfer ────────────────────────────────────────────────
  ipcMain.handle('helfer:getAll',    () => getAllHelfer())
  ipcMain.handle('helfer:save',      (_, data) => saveHelfer(data))
  ipcMain.handle('helfer:delete',    (_, id) => deleteHelfer(id))

  // ── Einsätze ──────────────────────────────────────────────
  ipcMain.handle('einsaetze:get',    (_, saisonId) => getEinsaetze(saisonId))
  ipcMain.handle('einsaetze:save',   (_, data) => saveEinsatz(data))
  ipcMain.handle('einsaetze:delete', (_, id) => deleteEinsatz(id))

  // ── Zimmer ────────────────────────────────────────────────
  ipcMain.handle('zimmer:getAll',           () => getAllZimmer())
  ipcMain.handle('zimmer:getBelegung',      (_, saisonId) => getZimmerBelegung(saisonId))
  ipcMain.handle('zimmer:saveBelegung',     (_, data) => saveZimmerBelegung(data))
  ipcMain.handle('zimmer:deleteBelegung',   (_, id) => deleteZimmerBelegung(id))

  // ── Anlässe ───────────────────────────────────────────────
  ipcMain.handle('anlaesse:get',    (_, saisonId) => getAnlaesse(saisonId))
  ipcMain.handle('anlaesse:save',   (_, data) => saveAnlass(data))
  ipcMain.handle('anlaesse:delete', (_, id) => deleteAnlass(id))

  // ── Menü ──────────────────────────────────────────────────
  ipcMain.handle('menue:get',  (_, saisonId) => getMenue(saisonId))
  ipcMain.handle('menue:save', (_, saisonId, pfad) => saveMenue(saisonId, pfad))

  // ── Einkaufsliste ─────────────────────────────────────────
  ipcMain.handle('einkauf:get',          (_, saisonId) => getEinkaufsliste(saisonId))
  ipcMain.handle('einkauf:save',         (_, data) => saveEinkaufsitem(data))
  ipcMain.handle('einkauf:toggleBesorgt',(_, id) => toggleEinkaufsitemBesorgt(id))
  ipcMain.handle('einkauf:delete',       (_, id) => deleteEinkaufsitem(id))

  // ── Rezepte ───────────────────────────────────────────────
  ipcMain.handle('rezepte:getAll',      () => getAllRezepte())
  ipcMain.handle('rezepte:save',        (_, data) => saveRezept(data))
  ipcMain.handle('rezepte:saveZutaten', (_, rezeptId, zutaten) => saveRezeptZutaten(rezeptId, zutaten))
  ipcMain.handle('rezepte:getZutaten',  (_, rezeptId) => getRezeptZutaten(rezeptId))
  ipcMain.handle('rezepte:delete',      (_, id) => deleteRezept(id))

  // ── Todos ─────────────────────────────────────────────────
  ipcMain.handle('todos:get',    (_, saisonId) => getTodos(saisonId))
  ipcMain.handle('todos:save',   (_, data) => saveTodo(data))
  ipcMain.handle('todos:delete', (_, id) => deleteTodo(id))

  // ── Learnings ─────────────────────────────────────────────
  ipcMain.handle('learnings:get',    (_, saisonId) => getLearnings(saisonId))
  ipcMain.handle('learnings:save',   (_, data) => saveLearning(data))
  ipcMain.handle('learnings:delete', (_, id) => deleteLearning(id))
}
