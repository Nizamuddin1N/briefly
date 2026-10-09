import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found — Briefly'
  }, [])

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-[340px] text-center">
        <h1 className="font-reading text-lg font-semibold text-ink">This page does not exist</h1>
        <p className="mt-2 text-xs text-graphite">
          The link may be out of date.{' '}
          <Link to="/" className="text-teal underline">
            Start new research
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
