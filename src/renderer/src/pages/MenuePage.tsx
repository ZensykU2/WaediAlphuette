import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { Menue as MenueType } from '../types'
import { UtensilsCrossed, FileText, Upload, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { formatDate } from '../lib/utils'

// The bundled default menu PDF shipped with the app
// In production it lives next to the executable; in dev it's in src/renderer/src/assets/
const DEFAULT_MENUE_PATH = 'Menue.pdf'

export default function MenuePage() {
  const activeSaison = useActiveSaison()
  const [menue, setMenue] = useState<MenueType | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const data = await window.api.getMenue(activeSaison.id)
    setMenue((data as MenueType) ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id])

  const openPdf = async (pfad?: string) => {
    const path = pfad ?? menue?.pfad
    if (!path) return
    // Use the Electron shell to open the file in the OS default PDF viewer
    if (window.electron?.shell?.openPath) {
      window.electron.shell.openPath(path)
    }
  }

  const selectNewPdf = async () => {
    if (!activeSaison) return
    const pfad = await window.api.openPdfDialog()
    if (!pfad) return
    setSaving(true)
    await window.api.saveMenue(activeSaison.id, pfad)
    await load()
    setSaving(false)
  }

  const setDefault = async () => {
    if (!activeSaison) return
    setSaving(true)
    // Resolve path to the bundled asset
    const assetPath = `${window.location.pathname.replace('/index.html', '')}/assets/${DEFAULT_MENUE_PATH}`
    await window.api.saveMenue(activeSaison.id, DEFAULT_MENUE_PATH)
    await load()
    setSaving(false)
  }

  if (!activeSaison) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-lg font-display font-semibold">Keine Saison aktiv</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Menü</h1>
        <p className="text-sm text-muted-foreground mt-1">Aktuelles Menü – zentral abrufbar</p>
      </div>

      {/* Current menu card */}
      <div className="alpine-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-alpine-400/15 border border-alpine-400/30 flex items-center justify-center">
            <FileText className="w-7 h-7 text-alpine-400" />
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-muted-foreground text-sm">Laden…</p>
            ) : menue ? (
              <>
                <p className="font-display font-semibold text-foreground text-lg truncate">
                  {menue.pfad.split(/[/\\]/).pop()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verknüpft am {formatDate(menue.hochgeladen_am.split('T')[0])}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate font-mono">{menue.pfad}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">Kein Menü hinterlegt</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verknüpfe das aktuelle Menü oder setze das Standard-Menü (Menue.pdf).
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-border flex-wrap">
          {menue && (
            <button onClick={() => openPdf()} className="btn-primary">
              <ExternalLink className="w-4 h-4" /> Menü öffnen
            </button>
          )}
          <button onClick={selectNewPdf} disabled={saving} className="btn-secondary">
            <Upload className="w-4 h-4" />
            {saving ? 'Speichern…' : 'Anderes PDF wählen'}
          </button>
          {!menue && (
            <button onClick={setDefault} disabled={saving} className="btn-secondary">
              <RefreshCw className="w-4 h-4" />
              Standard-Menü verwenden
            </button>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="alpine-card p-5">
        <div className="flex items-start gap-3">
          <UtensilsCrossed className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">So funktioniert das Menü</p>
            <p>Das Standard-Menü <span className="font-mono text-alpine-400 text-xs">Menue.pdf</span> wurde mit der App geliefert und zeigt das aktuelle Angebot.</p>
            <p>Du kannst jederzeit ein neues PDF hinterlegen — zum Beispiel wenn das Menü für die nächste Saison aktualisiert wird.</p>
            <p>Die Verknüpfung wird pro Saison gespeichert.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
