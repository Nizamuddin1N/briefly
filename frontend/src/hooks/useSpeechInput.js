import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Web Speech API wrapper, used as progressive enhancement. When the browser has
 * no SpeechRecognition (Firefox, most of Safari) `supported` is false and the
 * caller hides the mic entirely rather than showing a dead control.
 */
export function useSpeechInput({ onFinal, onInterim } = {}) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  // Keep the latest callbacks without re-creating the recognition object.
  const handlers = useRef({ onFinal, onInterim })
  handlers.current = { onFinal, onInterim }

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return undefined

    setSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) final += chunk
        else interim += chunk
      }
      if (interim) handlers.current.onInterim?.(interim)
      if (final) handlers.current.onFinal?.(final.trim())
    }

    recognition.onerror = (event) => {
      setListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError(
          "Microphone access is blocked. Allow it in your browser's site settings to use voice."
        )
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError('Voice input stopped unexpectedly. Try again.')
      }
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        /* already stopped */
      }
    }
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return
    setError(null)
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      /* start() throws if already running — ignore */
    }
  }, [listening])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      /* already stopped */
    }
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { supported, listening, error, start, stop, toggle, clearError: () => setError(null) }
}
