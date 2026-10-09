import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { toast } from 'sonner'
import { useSpeechInput } from '../../hooks/useSpeechInput'

const MAX_LENGTH = 500
const MIN_LENGTH = 3

/**
 * Auto-growing question box. Enter inserts a newline; Ctrl/Cmd+Enter submits,
 * and the hint says so rather than leaving it to be discovered.
 */
export default function Composer({
  value,
  onChange,
  onSubmit,
  busy = false,
  autoFocus = false,
  submitLabel = 'Research',
}) {
  const textareaRef = useRef(null)
  const [interim, setInterim] = useState('')

  const speech = useSpeechInput({
    onInterim: setInterim,
    onFinal: (text) => {
      setInterim('')
      onChange(value ? `${value.trim()} ${text}` : text)
      textareaRef.current?.focus()
    },
  })

  useEffect(() => {
    if (speech.error) {
      toast.error(speech.error)
      speech.clearError()
    }
  }, [speech])

  // Grow with the content, up to roughly eight rows.
  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`
  }, [value, interim])

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const trimmed = value.trim()
  const canSubmit = trimmed.length >= MIN_LENGTH && !busy

  const submit = () => {
    if (!canSubmit) return
    if (speech.listening) speech.stop()
    onSubmit(trimmed)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape' && speech.listening) {
      event.preventDefault()
      speech.stop()
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="rounded-composer border border-rule bg-sheet p-3 shadow-composer focus-within:border-teal"
    >
      <label htmlFor="research-query" className="sr-only">
        Research question
      </label>
      <textarea
        id="research-query"
        ref={textareaRef}
        rows={1}
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask a research question…"
        className="block w-full resize-none bg-transparent px-1 py-1 text-base text-ink outline-none placeholder:text-graphite"
      />

      {interim && (
        <p className="px-1 pb-1 text-sm italic text-graphite" aria-hidden="true">
          {interim}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2">
        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            aria-label={speech.listening ? 'Stop listening' : 'Dictate your question'}
            aria-pressed={speech.listening}
            className={[
              'grid size-8 shrink-0 place-items-center rounded-control',
              speech.listening
                ? 'bg-danger-soft text-danger'
                : 'text-graphite hover:bg-paper hover:text-ink',
            ].join(' ')}
          >
            {speech.listening ? (
              <Square size={14} aria-hidden="true" fill="currentColor" />
            ) : (
              <Mic size={16} aria-hidden="true" />
            )}
          </button>
        )}

        <span aria-live="polite" className="text-2xs text-graphite">
          {speech.listening
            ? 'Listening…'
            : trimmed.length > MAX_LENGTH - 80
              ? `${MAX_LENGTH - value.length} characters left`
              : ''}
        </span>

        <span className="ml-auto hidden text-[11px] text-graphite sm:inline">Ctrl+Enter</span>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-control bg-teal px-4 py-2 text-xs font-semibold text-teal-contrast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Sending…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
