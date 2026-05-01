import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Building2, User } from 'lucide-react'
import { useActiveSaison } from '../store/saisonStore'
import type { Einnahme, EinnahmeKategorie } from '../types'
import DataTable, { Column } from '../components/UI/DataTable'
import Badge from '../components/UI/Badge'
import Modal, { ConfirmModal } from '../components/UI/Modal'
import { formatCHF, formatDate, todayISO, kategorieLabelEinnahme, calcGetraenkeAnteile } from '../lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/UI/Select'
import { DatePicker } from '../components/UI/DatePicker'

const KATEGORIEN: EinnahmeKategorie[] = ['speisen', 'getraenke', 'uebernachtung', 'kegelbahn']

const emptyForm = {
  datum: todayISO(),
  kategorie: 'speisen' as EinnahmeKategorie,
  brutto: '',
  notiz: ''
}

export default function Einnahmen() {
  const activeSaison = useActiveSaison()
  const [rows, setRows] = useState<Einnahme[]>([])
  const [loading, setLoading] = useState(false)
  const [filterKat, setFilterKat] = useState<string>('alle')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState<Einnahme | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Einnahme | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!activeSaison) return
    setLoading(true)
    const filter = {
      saison_id: activeSaison.id,
      ...(filterKat !== 'alle' ? { kategorie: filterKat as EinnahmeKategorie } : {})
    }
    const data = await window.api.getEinnahmen(filter)
    setRows(data as Einnahme[])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSaison?.id, filterKat])

  const openAdd = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row: Einnahme) => {
    setEditRow(row)
    setForm({ datum: row.datum, kategorie: row.kategorie, brutto: String(row.brutto), notiz: row.notiz ?? '' })
    setModalOpen(true)
  }

  const save = async () => {
    if (!activeSaison || !form.brutto) return
    setSaving(true)
    const payload = { ...form, brutto: parseFloat(form.brutto), saison_id: activeSaison.id }
    if (editRow) await window.api.updateEinnahme(editRow.id, payload)
    else await window.api.addEinnahme(payload)
    setSaving(false)
    setModalOpen(false)
    await load()
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    await window.api.deleteEinnahme(deleteTarget.id)
    await load()
  }

  const privat = rows.reduce((s, r) => s + r.anteil_privat, 0)
  const verein = rows.reduce((s, r) => s + r.anteil_verein, 0)
  const total  = rows.reduce((s, r) => s + r.brutto, 0)

  const splitInfo = form.kategorie === 'getraenke' && form.brutto
    ? calcGetraenkeAnteile(parseFloat(form.brutto) || 0)
    : null

  const columns: Column<Einnahme>[] = [
    { key: 'datum', header: 'Datum', sortable: true, width: '110px', render: r => formatDate(r.datum) },
    { key: 'kategorie', header: 'Kategorie', render: r => <Badge value={r.kategorie} /> },
    { key: 'brutto', header: 'Brutto', sortable: true, align: 'right', render: r => formatCHF(r.brutto) },
    { key: 'anteil_privat', header: 'Privat', align: 'right', render: r => <span className="text-orange-300">{formatCHF(r.anteil_privat)}</span> },
    { key: 'anteil_verein', header: 'Verein', align: 'right', render: r => <span className="text-blue-300">{formatCHF(r.anteil_verein)}</span> },
    { key: 'notiz', header: 'Notiz', render: r => r.notiz ? <span className="text-muted-foreground text-xs">{r.notiz}</span> : null },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Einnahmen</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeSaison?.name} {activeSaison?.jahr}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-alpine-400 hover:bg-alpine-500 text-forest-900 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Einnahme
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Brutto', value: total, color: 'text-foreground' },
          { label: 'Anteil Privat', value: privat, color: 'text-orange-300' },
          { label: 'Anteil Verein', value: verein, color: 'text-blue-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="alpine-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-semibold tabular-nums mt-0.5 ${color}`}>{formatCHF(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-forest-800 rounded-lg w-fit">
        {['alle', ...KATEGORIEN].map(k => {
          const label = k === 'alle' ? 'Alle' : kategorieLabelEinnahme(k)
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

      <DataTable
        data={rows}
        columns={columns}
        keyFn={r => r.id}
        loading={loading}
        emptyMessage="Keine Einnahmen gefunden."
        actions={row => (
          <>
            <button
              onClick={() => openEdit(row)}
              className="p-1.5 rounded hover:bg-forest-700 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Einnahme bearbeiten' : 'Neue Einnahme'}
      >
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
                onValueChange={v => setForm(f => ({ ...f, kategorie: v as EinnahmeKategorie }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORIEN.map(k => (
                    <SelectItem key={k} value={k}>{kategorieLabelEinnahme(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Betrag (CHF)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              value={form.brutto}
              onChange={e => setForm(f => ({ ...f, brutto: e.target.value }))}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400"
            />
          </div>

          {/* Getränke split preview */}
          {splitInfo && (
            <div className="rounded-lg bg-forest-900/60 border border-border p-3 text-xs space-y-1">
              <p className="text-muted-foreground font-medium">Automatische Aufteilung (Getränke)</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">18% Privat</span>
                <span className="text-orange-300 font-medium tabular-nums">{formatCHF(splitInfo.privat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">82% Verein</span>
                <span className="text-blue-300 font-medium tabular-nums">{formatCHF(splitInfo.verein)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notiz (optional)</label>
            <input
              type="text"
              value={form.notiz}
              onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
              placeholder="z.B. Abendkasse Samstag"
              className="w-full px-3 py-2 rounded-md bg-forest-900 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-alpine-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-md text-sm bg-forest-700 hover:bg-forest-600 text-foreground transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={save}
              disabled={saving || !form.brutto || !form.datum}
              className="px-4 py-2 rounded-md text-sm font-medium bg-alpine-400 hover:bg-alpine-500 text-forest-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Einnahme löschen"
        message={deleteTarget?.zimmer_belegung_id 
          ? `Möchtest du diese Einnahme wirklich löschen? ACHTUNG: Die verknüpfte Zimmerbuchung wird ebenfalls gelöscht.` 
          : `Möchtest du die Einnahme vom ${formatDate(deleteTarget?.datum ?? '')} (${formatCHF(deleteTarget?.brutto ?? 0)}) wirklich löschen?`}
        confirmLabel="Löschen"
        danger
      />
    </div>
  )
}
