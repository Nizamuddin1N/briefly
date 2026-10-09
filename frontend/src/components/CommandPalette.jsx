import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { FileText, LogOut, Moon, Plus, Sun } from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { shortWhen } from '../lib/dates'

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { resolved, setTheme } = useTheme()
  const { data: history = [] } = useHistory({ enabled: open })

  const run = (action) => {
    onOpenChange(false)
    action()
  }

  const itemClass =
    'flex cursor-pointer items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-xs text-ink outline-none data-[selected=true]:bg-paper'

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="fixed inset-0 z-50"
      overlayClassName="fixed inset-0 z-40 bg-black/40"
      contentClassName="fixed left-1/2 top-[15vh] z-50 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-popover border border-rule bg-sheet shadow-popover"
    >
      <Command.Input
        placeholder="Search reports or run an action…"
        className="w-full border-b border-rule bg-transparent px-4 py-3.5 text-sm text-ink outline-none placeholder:text-graphite"
      />

      <Command.List className="max-h-[320px] overflow-y-auto p-2">
        <Command.Empty className="px-2.5 py-6 text-center text-xs text-graphite">
          Nothing matches that.
        </Command.Empty>

        <Command.Group
          heading="Actions"
          className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-graphite"
        >
          <Command.Item className={itemClass} onSelect={() => run(() => navigate('/'))}>
            <Plus size={15} aria-hidden="true" className="text-graphite" />
            New research
          </Command.Item>
          <Command.Item
            className={itemClass}
            onSelect={() => run(() => setTheme(resolved === 'dark' ? 'light' : 'dark'))}
          >
            {resolved === 'dark' ? (
              <Sun size={15} aria-hidden="true" className="text-graphite" />
            ) : (
              <Moon size={15} aria-hidden="true" className="text-graphite" />
            )}
            Switch to {resolved === 'dark' ? 'light' : 'dark'} theme
          </Command.Item>
          <Command.Item className={itemClass} onSelect={() => run(logout)}>
            <LogOut size={15} aria-hidden="true" className="text-graphite" />
            Sign out
          </Command.Item>
        </Command.Group>

        {history.length > 0 && (
          <Command.Group
            heading="Reports"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-graphite"
          >
            {history.map((item) => (
              <Command.Item
                key={item.id}
                value={`${item.query} ${item.id}`}
                className={itemClass}
                onSelect={() => run(() => navigate(`/report/${item.id}`))}
              >
                <FileText size={15} aria-hidden="true" className="shrink-0 text-graphite" />
                <span className="min-w-0 flex-1 truncate">{item.query}</span>
                <span className="shrink-0 text-[11px] text-graphite">
                  {shortWhen(item.created_at)}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}
