import { useEffect, useState, useMemo } from 'react'
import { 
  FileSpreadsheet, Save, Loader2, Database, Pencil, Trash2, 
  CheckCircle2, AlertTriangle, Calendar 
} from 'lucide-react'
import { toast } from 'sonner'
import { useActiveSaison } from '../store/saisonStore'
import { formatCHF, formatDate } from '../lib/utils'
import { calculateDrinkRow, calculateSettlementTotals } from '../lib/getraenkeUtils'
import type { GetraenkeAbrechnung, Getraenk } from '../types'
import Modal, { ConfirmModal } from '../components/UI/Modal'

export default function Getraenke() {
  const activeSaison = useActiveSaison()
  const [activeTab, setActiveTab] = useState<'settlement' | 'stammdaten'>('settlement')
  const [rows, setRows] = useState<GetraenkeAbrechnung[]>([])
  const [stammdaten, setStammdaten] = useState<Getraenk[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    if (!activeSaison) return
    setLoading(true)
    const [data, stam] = await Promise.all([
      window.api.getGetraenkeAbrechnung(activeSaison.id),
      window.api.getGetraenkeStammdaten()
    ])
    setRows(data)
    setStammdaten(stam)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [activeSaison?.id])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Getränkeabrechnung</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeSaison?.name} {activeSaison?.jahr}</p>
        </div>

        <div className="flex bg-forest-800 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setActiveTab('settlement')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'settlement' ? 'bg-alpine-400 text-forest-900 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Abrechnung
          </button>
          <button 
            onClick={() => setActiveTab('stammdaten')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'stammdaten' ? 'bg-alpine-400 text-forest-900 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Stammdaten
          </button>
        </div>
      </div>

      {activeTab === 'settlement' ? (
        <SettlementTab rows={rows} setRows={setRows} saisonId={activeSaison?.id} onRefresh={refresh} />
      ) : (
        <StammdatenTab data={stammdaten} onRefresh={refresh} />
      )}
    </div>
  )
}

function SettlementTab({ rows, setRows, saisonId, onRefresh }: any) {
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingStatus, setBookingStatus] = useState<any>(null)
  const [modal, setModal] = useState<{ open: boolean; type: 'book' | 'unbook' }>({ open: false, type: 'book' })

  useEffect(() => {
    if (saisonId) {
      window.api.getGetraenkeBookingStatus(saisonId).then(setBookingStatus)
    }
  }, [saisonId])

  const handleUpdate = (index: number, field: string, value: number) => {
    const next = [...rows]
    next[index] = { ...next[index], [field]: value }
    setRows(next)
  }

  const save = async () => {
    if (!saisonId) return
    setSaving(true)
    try {
      await window.api.saveGetraenkeAbrechnung(saisonId, rows)
      await onRefresh()
      
      // Check for low stock after save
      const lowItems = rows.filter((r: any) => r.bestand_abgabe <= (r.min_bestand || 0))
      if (lowItems.length > 0) {
        toast.warning('Niedriger Lagerbestand', {
          description: `${lowItems.length} Getränke sind unter dem Mindestbestand.`,
        })
      } else {
        toast.success('Gespeichert', { description: 'Getränkeabrechnung wurde erfolgreich aktualisiert.' })
      }
    } catch (err) {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const exportExcel = async () => {
    if (!saisonId) return
    const path = await window.api.saveFileDialog(`Getraenkeabrechnung_${saisonId}.xlsx`)
    if (path) {
      await window.api.exportGetraenkeExcel(saisonId, path)
      toast.success('Excel exportiert')
    }
  }

  const totals = calculateSettlementTotals(rows)
  const netAmount = totals.abrechnungsbetrag

  const bookToRevenue = async () => {
    if (!saisonId) return
    setBooking(true)
    try {
      await window.api.bookGetraenkeRevenue(saisonId, netAmount)
      const status = await window.api.getGetraenkeBookingStatus(saisonId)
      setBookingStatus(status)
      toast.success('Umsatz verbucht')
    } catch (err) {
      toast.error("Fehler beim Verbuchen.")
    } finally {
      setBooking(false)
    }
  }

  const unbookRevenue = async () => {
    if (!saisonId) return
    setBooking(true)
    try {
      await window.api.unbookGetraenkeRevenue(saisonId)
      setBookingStatus(null)
      toast.success('Buchung storniert')
    } catch (err) {
      toast.error("Fehler beim Stornieren.")
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3">
        <button 
          onClick={exportExcel} 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-600 text-foreground text-xs transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Saisonbericht
        </button>
        <button 
          onClick={() => {
            window.api.saveFileDialog(`Tagesbericht_${new Date().toISOString().split('T')[0]}.xlsx`).then(p => {
              if (p) window.api.exportGetraenkeExcel(saisonId, p, new Date().toISOString().split('T')[0])
            })
          }} 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-alpine-400/10 border border-alpine-400/30 hover:bg-alpine-400/20 text-alpine-400 text-xs transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          Tagesbericht
        </button>
        <button 
          onClick={save} 
          disabled={saving} 
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-alpine-400 hover:bg-alpine-500 text-forest-900 font-medium text-xs transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Speichern
        </button>
      </div>

      <div className="alpine-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="border-b border-border bg-forest-900/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="p-3 w-48">Produkt</th>
              <th className="p-2 text-center text-[9px]">Anfangsbestand</th>
              <th className="p-2 text-center text-[9px]">Lieferungen</th>
              <th className="p-2 text-center border-r border-border/30 text-[9px]">Verkauf (Gäste)</th>
              <th className="p-2 text-center">Eigen</th>
              <th className="p-2 text-center border-r border-border/30 text-[9px]">Helfer (Staff)</th>
              <th className="p-2 text-center bg-forest-700/20 text-emerald-400">Inventar Aktuell</th>
              <th className="p-2 text-center bg-forest-800/40">Total Verb.</th>
              <th className="p-2 text-center bg-forest-700/50 text-alpine-400">Umsatz Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {rows.map((row: any, i: number) => {
              const calcs = calculateDrinkRow(row)
              const isLow = calcs.bestand_abgabe_calc <= (row.min_bestand || 0)
              return (
                <tr key={row.getraenk_id} className="hover:bg-forest-700/30 transition-colors text-xs">
                  <td className="p-3">
                    <div className="flex items-center gap-2">

                       <div className="font-medium text-foreground">{row.name}</div>
                       {isLow && (
                         <span title="Niedriger Bestand">
                           <AlertTriangle className="w-3 h-3 text-amber-500" />
                         </span>
                       )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{row.groesse}</div>
                  </td>
                  <td className="p-1">
                    <input 
                      type="number" value={row.bestand_antritt || ''} 
                      onChange={e => handleUpdate(i, 'bestand_antritt', parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent border border-border/40 hover:border-alpine-400/50 focus:border-alpine-400 focus:ring-1 focus:ring-alpine-400 rounded p-1 text-center transition-all outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input 
                      type="number" value={row.lieferungen || ''} 
                      onChange={e => handleUpdate(i, 'lieferungen', parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent border border-border/40 hover:border-alpine-400/50 focus:border-alpine-400 focus:ring-1 focus:ring-alpine-400 rounded p-1 text-center transition-all outline-none"
                    />
                  </td>
                  <td className="p-1 border-r border-border/30">
                    <input 
                      type="number" value={row.verbrauch_gast || ''} 
                      onChange={e => handleUpdate(i, 'verbrauch_gast', parseInt(e.target.value) || 0)}
                      className="w-14 bg-emerald-900/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded p-1 text-center transition-all outline-none font-bold"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input 
                      type="number" value={row.eigenkonsum || ''} onChange={e => handleUpdate(i, 'eigenkonsum', parseInt(e.target.value) || 0)}
                      className="w-12 bg-transparent border border-border/40 hover:border-alpine-400/50 focus:border-alpine-400 focus:ring-1 focus:ring-alpine-400 rounded p-1 text-center transition-all outline-none"
                    />
                  </td>
                  <td className="p-1 border-r border-border/30 text-center">
                    <input 
                      type="number" value={row.helfer_konsum || ''} onChange={e => handleUpdate(i, 'helfer_konsum', parseInt(e.target.value) || 0)}
                      className="w-12 bg-transparent border border-border/40 hover:border-alpine-400/50 focus:border-alpine-400 focus:ring-1 focus:ring-alpine-400 rounded p-1 text-center transition-all outline-none"
                    />
                  </td>
                  <td className="p-2 text-center font-bold bg-forest-700/10">
                    <span className={isLow ? "text-amber-400" : "text-stone-300"}>{calcs.bestand_abgabe_calc}</span>
                  </td>
                  <td className="p-2 text-center bg-forest-700/20 text-muted-foreground">{calcs.verbrauch_total}</td>
                  <td className="p-2 text-center font-bold bg-forest-700/40 text-alpine-400">{calcs.abrechnungsbetrag.toFixed(2)}</td>
                </tr>

              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="alpine-card p-5 space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Totaler Umsatz</p>
          <p className="text-2xl font-bold text-alpine-400 tabular-nums">{formatCHF(netAmount)}</p>
          <div className="space-y-1 mt-3 pt-3 border-t border-border/50 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Umsatz Gäste (RP)</span>
              <span>{formatCHF(totals.umsatz_gast)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Umsatz Eigen (EK)</span>
              <span>{formatCHF(totals.umsatz_eigen)}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 alpine-card p-5">
          <div className="flex items-center justify-between h-full">
            <div>
              <h3 className="font-semibold text-sm">Finanzbuchhaltung</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Verbuchen Sie den Gesamtumsatz (Gäste + Eigenkonsum) direkt als Einnahme. Die Helfer-Kosten werden intern als Differenz verbucht.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {bookingStatus ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold justify-end">
                      <CheckCircle2 className="w-4 h-4" /> Verbucht
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Betrag: {formatCHF(bookingStatus.brutto)}</p>
                  </div>
                  <button onClick={() => setModal({ open: true, type: 'unbook' })} className="btn-secondary h-9">Stornieren</button>
                </div>
              ) : (
                <button 
                  onClick={() => setModal({ open: true, type: 'book' })}
                  className="btn-primary h-10 px-6"
                >
                  Jetzt Verbuchen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        onConfirm={modal.type === 'book' ? bookToRevenue : unbookRevenue}
        title={modal.type === 'book' ? "Umsatz verbuchen?" : "Buchung stornieren?"}
        message={modal.type === 'book' 
          ? `Möchten Sie den Betrag von ${formatCHF(netAmount)} als Einnahme verbuchen?`
          : "Möchten Sie die bestehende Buchung für diese Saison wirklich löschen?"
        }
        loading={booking}
      />
    </div>
  )
}

function StammdatenTab({ data, onRefresh }: any) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<Getraenk>>({})

  const openEdit = (row: any) => {
    setEditingId(row.id)
    setForm(row)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    await window.api.saveGetraenkStammdat(form)
    setEditingId(null)
    setForm({})
    onRefresh()
    toast.success('Stammdaten gespeichert')
  }

  const remove = async (id: number) => {
    await window.api.deleteGetraenkStammdat(id)
    onRefresh()
    toast.success('Produkt gelöscht')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <div className="alpine-card p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-alpine-400" />
            {editingId ? 'Produkt bearbeiten' : 'Neues Produkt'}
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bezeichnung</label>
              <input 
                required value={form.name || ''} 
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-forest-900 border border-border/40 rounded-md px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-alpine-400 focus:outline-none" 
                placeholder="z.B. Cola"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grösse / Gebinde</label>
              <input 
                value={form.groesse || ''} 
                onChange={e => setForm({...form, groesse: e.target.value})}
                className="w-full bg-forest-900 border border-border/40 rounded-md px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-alpine-400 focus:outline-none" 
                placeholder="z.B. 0.5l"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">VP (Gäste)</label>
                <input 
                  type="number" step="0.01" required
                  value={form.verkaufspreis || ''} 
                  onChange={e => setForm({...form, verkaufspreis: parseFloat(e.target.value) || 0})}
                  className="w-full bg-forest-900 border border-border/40 rounded-md px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-alpine-400 focus:outline-none" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">EK (Eigen)</label>
                <input 
                  type="number" step="0.01" required
                  value={form.ek_preis || ''} 
                  onChange={e => setForm({...form, ek_preis: parseFloat(e.target.value) || 0})}
                  className="w-full bg-forest-900 border border-border/40 rounded-md px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-alpine-400 focus:outline-none" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Helfer-EK</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.gast_preis || ''} 
                    onChange={e => setForm({...form, gast_preis: parseFloat(e.target.value) || 0})}
                    className="w-full bg-forest-900 border border-border/40 rounded-md px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-alpine-400 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mindestbest.</label>
                  <input 
                    type="number" required
                    value={form.min_bestand || 0} 
                    onChange={e => setForm({...form, min_bestand: parseInt(e.target.value) || 0})}
                    className="w-full bg-forest-900 border border-border/40 rounded-md px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-alpine-400 focus:outline-none" 
                  />
                </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Speichern</button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({}); }} className="btn-secondary">Abbrechen</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="alpine-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-forest-900/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Produkt</th>
                <th className="p-3 text-center">Gäste-VP</th>
                <th className="p-3 text-center">Eigen-EK</th>
                <th className="p-3 text-center">Helfer-EK</th>
                <th className="p-3 text-center">Mindest.</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((item: Getraenk) => (
                <tr key={item.id} className="group hover:bg-forest-700/30 transition-colors text-sm">
                  <td className="p-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.groesse}</div>
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-medium">{item.verkaufspreis.toFixed(2)}</td>
                  <td className="p-3 text-center text-muted-foreground">{item.ek_preis.toFixed(2)}</td>
                  <td className="p-3 text-center text-muted-foreground">{item.gast_preis.toFixed(2)}</td>
                  <td className="p-3 text-center font-medium text-amber-500/80">{item.min_bestand || 0}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded bg-forest-700 hover:bg-forest-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-stone-300" />
                      </button>
                      <button 
                        onClick={() => remove(item.id)}
                        className="p-1.5 rounded bg-forest-700 hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
