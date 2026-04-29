import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'
import logo from '../../assets/Logo.png'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.isMaximized().then(setIsMaximized)
    const unsub = window.api.onMaximizeChange(setIsMaximized)
    return unsub
  }, [])

  return (
    <div
      className="h-10 bg-forest-900 border-b border-border flex items-center justify-between select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: Logo & App Name */}
      <div className="flex items-center gap-3 px-4 h-full">
        <img
          src={logo}
          alt="Logo"
          className="h-6 w-auto object-contain"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pointer-events-none">
          Gruohubel — Team Renwy
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Minimize */}
        <button
          onClick={() => window.api.minimize()}
          className="flex items-center justify-center w-12 h-full hover:bg-forest-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Minimieren"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => window.api.maximize()}
          className="flex items-center justify-center w-12 h-full hover:bg-forest-800 text-muted-foreground hover:text-foreground transition-colors"
          title={isMaximized ? 'Wiederherstellen' : 'Maximieren'}
        >
          {isMaximized
            ? (
              /* Restore — two overlapping squares (Windows standard) */
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="1" width="9" height="9" rx="1" />
                <path d="M1 4v8a1 1 0 001 1h8" />
              </svg>
            ) : (
              /* Maximize — single square */
              <Square className="w-3 h-3" />
            )
          }
        </button>

        {/* Close */}
        <button
          onClick={() => window.api.close()}
          className="flex items-center justify-center w-12 h-full hover:bg-red-600/90 text-muted-foreground hover:text-white transition-colors"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
