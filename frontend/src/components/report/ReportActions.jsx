import { Copy, Download, PenLine, RotateCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Button from '../Button'
import { copyText, downloadMarkdown, slugify, toMarkdown } from '../../lib/markdown'

export default function ReportActions({ query, result, sources = [], onResearchAgain }) {
  const navigate = useNavigate()

  const handleCopy = async () => {
    const ok = await copyText(toMarkdown({ query, result, sources }))
    if (ok) toast.success('Copied')
    else toast.error('Could not copy. Select the text and copy it manually.')
  }

  const handleDownload = () => {
    downloadMarkdown(slugify(query), toMarkdown({ query, result, sources }))
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-rule pt-5">
      <Button onClick={handleCopy}>
        <Copy size={14} aria-hidden="true" />
        Copy
      </Button>
      <Button onClick={handleDownload}>
        <Download size={14} aria-hidden="true" />
        Download .md
      </Button>
      {onResearchAgain && (
        <Button onClick={onResearchAgain}>
          <RotateCw size={14} aria-hidden="true" />
          Research again
        </Button>
      )}
      <Button variant="ghost" onClick={() => navigate('/', { state: { prefill: query } })}>
        <PenLine size={14} aria-hidden="true" />
        Refine question
      </Button>
    </div>
  )
}
