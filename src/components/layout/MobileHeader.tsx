import { Disc } from '@phosphor-icons/react'

interface MobileHeaderProps {
  envLabel: string
  modeLabel: string
}

export default function MobileHeader({ envLabel, modeLabel }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-700/40 safe-area-inset-top shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
      <div className="px-3 sm:px-4 py-3 sm:py-3.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Logo with glow */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-xl bg-accent/25 blur-md" />
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-accent via-accent/80 to-accent/50 rounded-xl flex items-center justify-center shadow-md shadow-accent/20">
              <Disc className="w-5 h-5 sm:w-5 sm:h-5 text-accent-foreground" weight="bold" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold leading-tight truncate bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Vinylaysis
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate leading-tight">
              {envLabel} · {modeLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
