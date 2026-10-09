import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

export default function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme()
  const Current = resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-control text-graphite hover:bg-paper hover:text-ink"
          aria-label={`Theme: ${theme}. Change theme`}
        >
          <Current size={16} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 rounded-popover border border-rule bg-sheet p-1 shadow-popover"
        >
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenu.Item
              key={value}
              onSelect={() => setTheme(value)}
              className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-xs outline-none data-[highlighted]:bg-paper"
            >
              <Icon size={15} aria-hidden="true" className="text-graphite" />
              {label}
              {theme === value && <Check size={14} aria-hidden="true" className="ml-auto text-teal" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
