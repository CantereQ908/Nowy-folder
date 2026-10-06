import { useState } from 'react'

export function CopyButton({ text, label = 'Kopiuj tekst' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('done')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button type="button" className="btn small" disabled={!text} onClick={() => void copy()} aria-live="polite">
      {state === 'done' ? 'Skopiowano ✓' : state === 'failed' ? 'Nie udało się' : label}
    </button>
  )
}
