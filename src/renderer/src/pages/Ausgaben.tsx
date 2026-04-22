import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useActiveSaison } from '../store/saisonStore'
import type { Ausgabe, AusgabeKategorie, Traeger } from '../types'
import DataTable, { Column } from '../components/UI/DataTable'
import Badge from '../components/UI/Badge'
import Modal, { ConfirmModal } from '../components/UI/Modal'
import { formatCHF, formatDate, todayISO, kategorieLabelAusgabe } from '../lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/UI/Select'
import { DatePicker } from '../components/UI/DatePicker'

const KATEGORIEN: AusgabeKategorie[] = ['lebensmittel', 'dekoration', 'anschaffung', 'sonstiges']

const emptyForm = {
  datum: todayISO(),
  kategorie: 'lebensmittel' as AusgabeKategorie,
  betrag: '',
  traeger: 'verein' as Traeger,
  notiz: ''
}

export default function Ausgaben() {
  const activeSaison = useActiveSaison()
  const [rows, setRows] = useState<Ausgabe[]>([])
  const [loading, setLoading] = useState(false)
  const [filterKat, setFilterKat] = useState<string>('alle')
  const [filterTraeger, setFilterTraeger] = useState<string>('alle')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState<Ausgabe | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ausgabe | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const filter = {
      saison_id: activeSaison.id,
      ...(filterKat !== 'alle' ? { kategorie: filterKat as AusgabeKategorie } : {}),
      ...(filterTraeger !== 'alle' ? { traeger: filterTraeger as Traeger } : {})
    }
    const data = await window.api.getAusgaben(filter)
    setRows(data as Ausgabe[])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id, filterKat, filterTraeger])

  const openAdd = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row: Ausgabe) => {
    setEditRow(row)
    setForm({ datum: row.datum, kategorie: row.kategorie, betrag: String(row.betrag), traeger: row.traeger, notiz: row.notiz ?? '' })
    setModalOpen(true)
  }

  const save = async () => {
    if (!activeSaison || !form.betrag) return
    setSaving(true)
    const payload = { ...form, betrag: parseFloat(form.betrag), saison_id: activeSaison.id }
    if (editRow) await window.api.updateAusgabe(editRow.id, payload)
    else await window.api.addAusgabe(payload)
    setSaving(false)
    setModalOpen(false)
    await load()
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    await window.api.deleteAusgabe(deleteTarget.id)
    await load()
  }

  const totalVerein = rows.filter(r => r.traeger === 'verein').reduce((s, r) => s + r.betrag, 0)
  const totalPrivat = rows.filter(r => r.traeger === 'privat').reduce((s, r) => s + r.betrag, 0)
  const total = rows.reduce((s, r) => s + r.betrag, 0)

  const columns: Column<Ausgabe>[] = [
    { key: 'datum', header: 'Datum', sortable: true, width: '110px', render: r => formatDate(r.datum) },
    { key: 'kategorie', header: 'Kategorie', render: r => <Badge value={r.kategorie} /> },
    { key: 'betrag', header: 'Betrag', sortable: true, align: 'right', render: r => formatCHF(r.betrag) },
    { key: 'traeger', header: 'Träger', align: 'center', render: r => <Badge value={r.traeger} /> },
    { key: 'notiz', header: 'Notiz', render: r => r.notiz ? <span className="text-muted-foreground text-xs">{r.notiz}</span> : null },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ausgaben</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeSaison?.name} {activeSaison?.jahr}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-alpine-400 hover:bg-alpine-500 text-forest-900 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Neue Ausgabe
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Ausgaben', value: total, color: 'text-foreground' },
          { label: 'Träger Privat',  value: totalPrivat, color: 'text-orange-300' },
          { label: 'Träger Verein',  value: totalVerein, color: 'text-blue-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="alpine-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-semibold tabular-nums mt-0.5 ${color}`}>{formatCHF(value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-1 bg-forest-800 rounded-lg">
          {['alle', ...KATEGORIEN].map(k => {
            const label = k === 'alle' ? 'Alle' : kategorieLabelAusgabe(k)
            return (
              <button
                key={k}
                onClick={() => setFilterKat(k)}
                data-text={label}
                className={`px-3 py-1.5 rounded-md text-sm transition-all tab-anti-shift ${
                  filterKat === k
                    ? 'bg-alpine-400 text-alpine-900 font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-1 p-1 bg-forest-800 rounded-lg">
          {['alle', 'verein', 'privat'].map(t => {
            const label = t === 'alle' ? 'Alle Träger' : t.charAt(0).toUpperCase() + t.slice(1)
            return (
              <button
                key={t}
                onClick={() => setFilterTraeger(t)}
                data-text={label}
                className={`px-3 py-1.5 rounded-md text-sm transition-all tab-anti-shift ${
                  filterTraeger === t
                    ? 'bg-alpine-400 text-alpine-900 font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <DataTable data={rows} columns={columns} keyFn={r => r.id} loading={loading}
        emptyMessage="Keine Ausgaben gefunden."
        actions={row => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRow ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                label="Datum"
                value={form.datum}
                onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Kategorie</label>
              <Select
                value={form.kategorie}
                onValueChange={v => setForm(f => ({ ...f, kategorie: v as AusgabeKategorie }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORIEN.map(k => (
                    <SelectItem key={k} value={k}>{kategorieLabelAusgabe(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Betrag (CHF)</label>
              <input type="number" step="0.05" min="0" value={form.betrag}
                onChange={e => setForm(f => ({ ...f, betrag: e.target.value }))} placeholder="0.00"
                className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Träger</label>
              <Select
                value={form.traeger}
                onValueChange={v => setForm(f => ({ ...f, traeger: v as Traeger }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Träger wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verein">Verein</SelectItem>
                  <SelectItem value="privat">Privat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notiz (optional)</label>
            <input type="text" value={form.notiz} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
              placeholder="z.B. Einkauf Migros"
              className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-md text-sm bg-forest-700 hover:bg-forest-600 text-foreground transition-colors">Abbrechen</button>
            <button onClick={save} disabled={saving || !form.betrag}
              className="px-4 py-2 rounded-md text-sm font-medium bg-alpine-400 hover:bg-alpine-500 text-forest-900 transition-colors disabled:opacity-50">
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete}
        title="Ausgabe löschen" danger confirmLabel="Löschen"
        message={`Möchtest du die Ausgabe vom ${formatDate(deleteTarget?.datum ?? '')} (${formatCHF(deleteTarget?.betrag ?? 0)}) wirklich löschen?`}
      />
    </div>
  )
}
