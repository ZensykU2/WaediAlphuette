import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Saison } from '../types'

interface SaisonStore {
  saisons: Saison[]
  activeSaisonId: number | null
  loadSaisons: () => Promise<void>
  setActive: (id: number) => Promise<void>
  createSaison: (data: Partial<Saison>) => Promise<void>
  updateSaison: (id: number, data: Partial<Saison>) => Promise<void>
  deleteSaison: (id: number) => Promise<void>
}

export const useSaisonStore = create<SaisonStore>()(
  persist(
    (set, get) => ({
      saisons: [],
      activeSaisonId: null,

      loadSaisons: async () => {
        const saisons = (await window.api.getSaisons()) as Saison[]
        const active = saisons.find(s => s.is_active === 1)
        set({ saisons, activeSaisonId: active?.id ?? get().activeSaisonId })
      },

      setActive: async (id: number) => {
        await window.api.setActiveSaison(id)
        set(state => ({
          activeSaisonId: id,
          saisons: state.saisons.map(s => ({ ...s, is_active: s.id === id ? 1 : 0 }))
        }))
      },

      createSaison: async (data) => {
        await window.api.createSaison(data)
        await get().loadSaisons()
      },
      updateSaison: async (id, data) => {
        await window.api.updateSaison(id, data)
        await get().loadSaisons()
      },

      deleteSaison: async (id: number) => {
        await window.api.deleteSaison(id)
        const { activeSaisonId, saisons } = get()
        const remaining = saisons.filter(s => s.id !== id)
        const newActive = activeSaisonId === id ? (remaining[0]?.id ?? null) : activeSaisonId
        if (newActive && newActive !== activeSaisonId) await window.api.setActiveSaison(newActive)
        set({ saisons: remaining, activeSaisonId: newActive })
      }
    }),
    { name: 'waedi-saison-store', partialize: state => ({ activeSaisonId: state.activeSaisonId }) }
  )
)

export const useActiveSaison = () => {
  const { saisons, activeSaisonId } = useSaisonStore()
  return saisons.find(s => s.id === activeSaisonId) ?? null
}
