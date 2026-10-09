import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthAside from '../components/AuthAside'
import { useAuth } from '../hooks/useAuth'

/** Put the API's complaint next to the field it belongs to. */
function fieldErrorsFor(message = '') {
  if (/username already taken/i.test(message)) {
    return { username: 'That username is taken — pick another.' }
  }
  if (/email already registered/i.test(message)) {
    return { email: 'An account already uses this email. Sign in instead?' }
  }
  if (/^email/i.test(message)) return { email: message }
  if (/^password/i.test(message)) return { password: message }
  if (/^username/i.test(message)) return { username: message }
  return { form: message }
}

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const { signup, status } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Create an account — Briefly'
  }, [])

  useEffect(() => {
    if (status === 'authenticated') navigate('/', { replace: true })
  }, [status, navigate])

  const validate = () => {
    const next = {}
    if (username.trim().length < 3) next.username = 'Use at least 3 characters.'
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await signup({ username: username.trim(), email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (error) {
      setErrors(fieldErrorsFor(error?.message))
    } finally {
      setBusy(false)
    }
  }

  const fieldClass = (hasError) =>
    [
      'w-full rounded-control border bg-sheet px-3 py-2 text-xs text-ink',
      hasError ? 'border-danger' : 'border-rule focus:border-teal',
    ].join(' ')

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-2">
      <AuthAside />

      <div className="grid min-h-dvh place-items-center px-6 py-12">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-[360px]">
          <h1 className="font-reading text-lg font-semibold text-ink">Create an account</h1>

          <div className="mt-6">
            <label htmlFor="username" className="mb-1.5 block text-2xs text-graphite">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
              className={fieldClass(errors.username)}
            />
            {errors.username && (
              <p id="username-error" role="alert" className="mt-1.5 text-[11px] text-danger">
                {errors.username}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="email" className="mb-1.5 block text-2xs text-graphite">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={fieldClass(errors.email)}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-[11px] text-danger">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="password" className="mb-1.5 block text-2xs text-graphite">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                className={`${fieldClass(errors.password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-control text-graphite hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff size={15} aria-hidden="true" />
                ) : (
                  <Eye size={15} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p id="password-error" role="alert" className="mt-1.5 text-[11px] text-danger">
                {errors.password}
              </p>
            ) : (
              <p id="password-hint" className="mt-1.5 text-[11px] text-graphite">
                At least 8 characters.
              </p>
            )}
          </div>

          {errors.form && (
            <p role="alert" className="mt-4 text-xs text-danger">
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-control bg-teal px-4 py-2.5 text-xs font-semibold text-teal-contrast hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>

          <p className="mt-5 text-2xs text-graphite">
            Already have an account?{' '}
            <Link to="/login" className="text-teal underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
