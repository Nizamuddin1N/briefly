import { useCallback, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu, PanelLeft, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import HistoryRail from './HistoryRail'
import CommandPalette from '../CommandPalette'

const COLLAPSE_KEY = 'ra_rail_collapsed'

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const navigate = useNavigate()

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  // Global shortcuts: Cmd/Ctrl+K opens the palette, `[` collapses the rail.
  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(event.target?.tagName)

      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (event.key === '[' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleCollapsed])

  return (
    <div className="min-h-dvh bg-paper">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-rule bg-paper px-3 py-2 md:hidden">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-label="Open history"
              className="grid size-9 place-items-center rounded-control text-graphite hover:bg-sheet hover:text-ink"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
            {/* Radix traps focus while open and restores it to the trigger on close. */}
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-rule bg-paper focus:outline-none">
              <Dialog.Title className="sr-only">Research history</Dialog.Title>
              <Dialog.Description className="sr-only">
                Your recent reports, and a link to start new research.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close history"
                  className="absolute right-2 top-3 grid size-8 place-items-center rounded-control text-graphite hover:bg-sheet"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </Dialog.Close>
              <HistoryRail onNavigate={() => setDrawerOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <span className="flex-1 truncate font-reading text-sm font-semibold">Briefly</span>

        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="New research"
          className="grid size-9 place-items-center rounded-control text-graphite hover:bg-sheet hover:text-ink"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="flex">
        {/* Desktop rail */}
        <aside
          className={[
            'sticky top-0 hidden h-dvh shrink-0 border-r border-rule md:block',
            collapsed ? 'w-0 overflow-hidden' : 'w-[272px]',
          ].join(' ')}
          aria-label="Sidebar"
        >
          <HistoryRail />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-1 px-4 pt-3 md:flex">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
              aria-expanded={!collapsed}
              className="grid size-8 place-items-center rounded-control text-graphite hover:bg-sheet hover:text-ink"
            >
              <PanelLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="rounded-control px-2 py-1 text-2xs text-graphite hover:bg-sheet hover:text-ink"
            >
              Search reports
              <kbd className="ml-2 rounded border border-rule px-1 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>
          </div>

          <main id="main" className="px-4 pb-24 pt-4 md:px-8">
            {children}
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
