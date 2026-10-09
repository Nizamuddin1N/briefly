import SourceMargin from './report/SourceMargin'

/**
 * Previews the product instead of decorating the page: a short excerpt using
 * the report's own `.prose` styles and the real SourceMargin/SourceNote
 * components. The excerpt is written as static markup rather than run through
 * react-markdown, so the sign-in page does not load the markdown pipeline —
 * it renders identically and keeps the first page people hit light.
 */
const SAMPLE_QUERY = 'How do solid-state batteries work?'

const SAMPLE_SOURCES = [
  'https://en.wikipedia.org/wiki/Solid-state_battery',
  'https://www.nature.com/articles/s41560-023-01208-9',
]

export default function AuthAside() {
  return (
    <div className="hidden min-h-dvh flex-col justify-center border-r border-rule bg-paper px-10 py-12 lg:flex">
      <div className="mx-auto w-full max-w-[460px]">
        <h1 className="font-reading text-lg font-semibold text-ink">Briefly</h1>
        <p className="mt-2 max-w-[38ch] text-xs leading-relaxed text-graphite">
          Ask a question. Get a sourced briefing in under a minute.
        </p>

        <figure className="mt-10 rounded-sheet border border-rule bg-sheet p-6">
          <figcaption className="mb-4 text-[11px] text-graphite">Example report</figcaption>
          <h2 className="font-reading text-base font-semibold leading-snug text-ink">
            {SAMPLE_QUERY}
          </h2>

          <div className="prose mt-4 text-sm">
            <p>
              Solid-state batteries replace the liquid electrolyte of a conventional lithium-ion
              cell with a solid one — typically a ceramic, a sulfide, or a polymer.
            </p>
            <ul>
              <li>
                <strong>Higher energy density.</strong> A solid electrolyte allows a lithium-metal
                anode, storing more energy in the same volume.
              </li>
              <li>
                <strong>Better thermal behaviour.</strong> With no flammable liquid, thermal
                runaway is far less likely.
              </li>
              <li>
                <strong>Slower at low temperature.</strong> Ion conductivity drops more sharply in
                a solid than in a liquid, which remains the main engineering obstacle.
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-rule pt-4">
            <SourceMargin sources={SAMPLE_SOURCES} />
          </div>
        </figure>
      </div>
    </div>
  )
}
