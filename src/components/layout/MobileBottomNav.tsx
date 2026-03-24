import type { ElementType } from 'react'
import type { TabValue } from '@/lib/types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NavItem {
  value: TabValue
  icon: ElementType
  label: string
}

interface MobileBottomNavProps {
  navItems: readonly NavItem[]
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
}

export default function MobileBottomNav({ navItems, activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="flex-shrink-0 backdrop-blur-xl bg-slate-950/90 border-t border-slate-700/40 pb-safe-area-inset-bottom shadow-[0_-1px_12px_rgba(0,0,0,0.4)]">
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabValue)}>
        <TabsList className="w-full min-h-[64px] grid grid-cols-11 bg-transparent border-0 p-0 gap-0">
          {navItems.map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="relative flex-col gap-1 h-full min-h-[64px] rounded-none data-[state=active]:bg-transparent data-[state=active]:text-accent text-slate-500 data-[state=active]:shadow-none border-0 px-0.5 sm:px-1 touch-manipulation active:scale-95 transition-all duration-200 group"
            >
              {/* Active pill indicator at top */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-200 ${
                  activeTab === value ? 'w-6 bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'w-0 bg-transparent'
                }`}
              />
              <Icon
                className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-all duration-200 ${
                  activeTab === value ? 'drop-shadow-[0_0_5px_var(--color-accent)]' : 'group-hover:text-slate-300'
                }`}
                weight="fill"
              />
              <span className="text-[9px] sm:text-[10px] leading-tight font-medium">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  )
}
