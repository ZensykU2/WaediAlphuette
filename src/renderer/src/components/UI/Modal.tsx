import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  // Use a Portal to render at the top level of the document body
  // This bypasses any stacking contexts (like transforms/animations) in the parent components
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className={cn(
        'relative w-full bg-forest-800 border border-border rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200',
        sizeClass
      )}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-forest-700 transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message, confirmLabel = 'Bestätigen', danger = false, loading = false
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm bg-forest-700 hover:bg-forest-600 text-foreground transition-colors disabled:opacity-50"
        >
          Abbrechen
        </button>
        <button
          onClick={async () => { await onConfirm(); if (!loading) onClose(); }}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50',
            danger
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-alpine-400 hover:bg-alpine-500 text-forest-900'
          )}
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
