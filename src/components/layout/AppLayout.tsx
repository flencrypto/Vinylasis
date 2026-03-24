import type { ReactNode, ElementType } from 'react'
import type { TabValue } from '@/lib/types'
import { useDeviceDetect } from '@/hooks/use-device-detect'
import DesktopSidebar from './DesktopSidebar'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'

interface NavItem {
  value: TabValue
  icon: ElementType
  label: string
}

interface AppLayoutProps {
  children: ReactNode
  navItems: readonly NavItem[]
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
  envLabel: string
  modeLabel: string
}

/**
 * AppLayout — top-level shell component.
 *
 * Desktop: fixed sidebar (branding at top, nav pinned to bottom) + scrollable content area.
 * Mobile/tablet: sticky header + scrollable content area + fixed bottom nav bar.
 *
 * CSS container classes are defined in index.css (.app-layout, .app-sidebar,
 * .app-content, .app-bottom-nav).
 */
export default function AppLayout({
  children,
  navItems,
  activeTab,
  onTabChange,
  envLabel,
  modeLabel,
}: AppLayoutProps) {
  const { isDesktop } = useDeviceDetect()

  if (isDesktop) {
    return (
      <div className="app-layout app-layout--desktop">
        <DesktopSidebar
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          envLabel={envLabel}
          modeLabel={modeLabel}
        />

        <main className="app-content">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout app-layout--mobile">
      <MobileHeader envLabel={envLabel} modeLabel={modeLabel} />

      <main className="app-content">
        {children}
      </main>

      <MobileBottomNav
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  )
}
