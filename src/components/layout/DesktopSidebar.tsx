import { Disc } from '@phosphor-icons/react'
import type { ElementType } from 'react'
import type { TabValue } from '@/lib/types'

interface NavItem {
  value: TabValue
  icon: ElementType
  label: string
}

interface DesktopSidebarProps {
  navItems: readonly NavItem[]
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
  envLabel: string
  modeLabel: string
}

export default function DesktopSidebar({ navItems, activeTab, onTabChange, envLabel, modeLabel }: DesktopSidebarProps) {
  return (
    <aside className="flex flex-col w-56 flex-shrink-0 h-screen backdrop-blur-xl bg-slate-950/90 border-r border-slate-700/40 overflow-y-auto">
      {/* Branding */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/40">
        {/* Logo icon with glow ring */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-xl bg-accent/30 blur-md" />
          <div className="relative w-10 h-10 bg-gradient-to-br from-accent via-accent/80 to-accent/50 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Disc className="w-5 h-5 text-accent-foreground" weight="bold" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold leading-tight truncate bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            VinylVault
          </h1>
          <p className="text-[10px] text-slate-500 truncate leading-tight">
            {envLabel} · {modeLabel}
          </p>
        </div>
      </div>

      {/* Spacer pushes nav to bottom */}
      <div className="flex-1" />

      {/* Nav items pinned to bottom */}
      <nav className="flex flex-col p-3 gap-0.5 border-t border-slate-700/40">
        <p className="text-[9px] font-semibold tracking-widest text-slate-600 uppercase px-3 pb-2 pt-0.5">
          Navigation
        </p>
        {navItems.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => onTabChange(value)}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 w-full group ${
              activeTab === value
                ? 'bg-slate-800/70 text-accent border-l-2 border-accent pl-[10px]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-2 border-transparent pl-[10px]'
            }`}
          >
            <Icon
              className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                activeTab === value ? 'drop-shadow-[0_0_6px_var(--color-accent)]' : 'group-hover:text-slate-200'
              }`}
              weight="fill"
            />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
