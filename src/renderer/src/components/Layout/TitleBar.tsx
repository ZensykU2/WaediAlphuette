import { Minus, Square, X, Maximize2 } from 'lucide-react'
import logo from '../../assets/Logo.png'

export default function TitleBar() {
  const handleMinimize = () => window.api.minimize()
  const handleMaximize = () => window.api.maximize()
  const handleClose = () => window.api.close()

  return (
    <div className="h-10 bg-forest-900 border-b border-border flex items-center justify-between select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Left: Logo & App Name */}
      <div className="flex items-center gap-3 px-4 h-full">
        <img src={logo} alt="Logo" className="h-6 w-auto object-contain" style={{ WebkitAppRegion: 'no-drag' } as any} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pointer-events-none">
          Gruohubel — Team Renwy
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-12 h-full hover:bg-forest-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Minimieren"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-12 h-full hover:bg-forest-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Maximieren"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-12 h-full hover:bg-red-600/90 text-muted-foreground hover:text-white transition-colors"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
