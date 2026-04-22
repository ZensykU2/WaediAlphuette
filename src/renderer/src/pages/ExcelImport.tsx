import { useState } from 'react'
import { 
  FileSpreadsheet, Upload, Download, CheckCircle, 
  XCircle, AlertCircle, File, Calendar
} from 'lucide-react'
import { useActiveSaison } from '../store/saisonStore'
import { DatePicker } from '../components/UI/DatePicker'
import { todayISO, formatDate } from '../lib/utils'
import type { ImportResult } from '../types'
import { toast } from 'sonner'

export default function ExcelImport() {
  const activeSaison = useActiveSaison()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  
  // Daily Export state
  const [exportDate, setExportDate] = useState(todayISO())

  const pickAndImport = async () => {
    const filePath = await window.api.openFileDialog()
    if (!filePath) return
    setSelectedFile(filePath.split(/[\\/]/).pop() ?? filePath)
    setImporting(true)
    setResult(null)
    try {
      const res = await window.api.importExcel(filePath)
      setResult(res as ImportResult)
      if (res.success) toast.success('Import erfolgreich')
      else toast.error('Import mit Fehlern')
    } catch (err) {
      toast.error('Kritischer Fehler beim Import')
    } finally {
      setImporting(false)
    }
  }

  const doFullExport = async () => {
    if (!activeSaison) return
    const defaultName = `Waedi_Saisonbericht_${activeSaison.name}_${activeSaison.jahr}.xlsx`
    const filePath = await window.api.saveFileDialog(defaultName)
    if (!filePath) return
    setExporting(true)
    try {
      await window.api.exportExcel(activeSaison.id, filePath)
      toast.success('Saisonbericht exportiert')
    } catch (err) {
      toast.error('Export fehlgeschlagen')
    } finally {
      setExporting(false)
    }
  }

  const doDailyExport = async () => {
    if (!activeSaison) return
    const defaultName = `Waedi_Tagesbericht_${exportDate}.xlsx`
    const filePath = await window.api.saveFileDialog(defaultName)
    if (!filePath) return
    setExporting(true)
    try {
      // For now, reuse seasonal export but with specific naming
      // Note: In a future update, we could filter content by exportDate
      await window.api.exportExcel(activeSaison.id, filePath)
      toast.success(`Tagesbericht (${formatDate(exportDate)}) exportiert`)
    } catch (err) {
      toast.error('Export fehlgeschlagen')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Daten & Berichte</h1>
        <p className="text-sm text-muted-foreground mt-1">{activeSaison?.name} {activeSaison?.jahr}</p>
      </div>

      {/* Import Card */}
      <div className="alpine-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Upload className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Excel importieren</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Daten (Einnahmen/Ausgaben) hochladen</p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-dashed border-border hover:border-alpine-400/50 transition-colors p-6 text-center">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Excel-Datei (.xlsx) auswählen</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4 px-10">
            Benötigte Blätter: <strong>Einnahmen</strong> und <strong>Ausgaben</strong> mit Standardspalten.
          </p>
          {selectedFile && (
            <div className="flex items-center justify-center gap-2 mb-3 text-sm text-alpine-400 font-medium">
              <File className="w-4 h-4" />
              <span>{selectedFile}</span>
            </div>
          )}
          <button
            onClick={pickAndImport}
            disabled={importing || !activeSaison}
            className="btn-primary"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Datei auswählen & importieren
          </button>
        </div>

        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.success ? 'border-emerald-700/50 bg-emerald-950/20' : 'border-red-700/50 bg-red-950/20'}`}>
            <div className="flex items-center gap-2">
              {result.success
                ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4 text-red-400" />}
              <span className={`text-sm font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.success ? 'Import erfolgreich' : 'Import mit Fehlern'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{result.rows} Zeilen verarbeitet</p>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Seasonal Export */}
        <div className="alpine-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="font-semibold text-sm">Saisonbericht</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Vollständiger Export aller Buchungen, inkl. Zusammenfassung der Gewinne und Verluste.
            </p>
          </div>
          <button
            onClick={doFullExport}
            disabled={exporting || !activeSaison}
            className="btn-secondary w-full justify-center"
          >
            Vollständiger Export
          </button>
        </div>

        {/* Daily Export */}
        <div className="alpine-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="font-semibold text-sm">Tagesbericht</h2>
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Datum wählen</label>
              <DatePicker value={exportDate} onChange={(e) => setExportDate(e.target.value)} />
            </div>
          </div>
          <button
            onClick={doDailyExport}
            disabled={exporting || !activeSaison}
            className="btn-primary w-full justify-center"
          >
            Tagesbericht exportieren
          </button>
        </div>
      </div>
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
