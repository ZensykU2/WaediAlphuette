import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TitleBar from './TitleBar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-forest-900 border border-border shadow-2xl">
      {/* Frameless TitleBar */}
      <TitleBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 animate-fade-in relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
