import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import AppShell from './components/Layout/AppShell'
import Dashboard from './pages/Dashboard'
import Einnahmen from './pages/Einnahmen'
import Ausgaben from './pages/Ausgaben'
import Budgetplanung from './pages/Budgetplanung'
import Auswertung from './pages/Auswertung'
import ExcelImport from './pages/ExcelImport'
import Einstellungen from './pages/Einstellungen'
import Getraenke from './pages/Getraenke'
import { useSaisonStore, useActiveSaison } from './store/saisonStore'

export default function App() {
  const loadSaisons = useSaisonStore(s => s.loadSaisons)
  const activeSaison = useActiveSaison()

  useEffect(() => {
    loadSaisons()
  }, [])

  // Daily low stock check
  useEffect(() => {
    if (!activeSaison) return

    const checkLowStock = async () => {
      const today = new Date().toISOString().split('T')[0]
      const lastCheck = localStorage.getItem(`low_stock_check_${activeSaison.id}`)

      if (lastCheck !== today) {
        const rows = await window.api.getGetraenkeAbrechnung(activeSaison.id)
        const lowStockItems = rows.filter(r => r.bestand_abgabe <= (r.min_bestand || 0))
        
        if (lowStockItems.length > 0) {
          toast.warning('Niedriger Lagerbestand', {
            description: `${lowStockItems.length} Getränke sind unter dem Mindestbestand.`,
            duration: 10000,
          })
        }
        localStorage.setItem(`low_stock_check_${activeSaison.id}`, today)
      }
    }

    // Delay a bit to let the app settle
    const timer = setTimeout(checkLowStock, 2000)
    return () => clearTimeout(timer)
  }, [activeSaison?.id])

  return (
    <>
      <Toaster 
        theme="dark" 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: '#1a1c14',
            border: '1px solid #2d2f26',
            color: '#fdfdfd',
          },
        }}
      />
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/einnahmen" element={<Einnahmen />} />
          <Route path="/ausgaben" element={<Ausgaben />} />
          <Route path="/budget" element={<Budgetplanung />} />
          <Route path="/getraenke" element={<Getraenke />} />
          <Route path="/auswertung" element={<Auswertung />} />
          <Route path="/excel" element={<ExcelImport />} />
          <Route path="/einstellungen" element={<Einstellungen />} />
        </Routes>
      </AppShell>
    </>
  )
}
