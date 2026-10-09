import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthAside from '../components/AuthAside'
import { useAuth } from '../hooks/useAuth'

/** Map the API's message onto the field it actually concerns. */
function fieldErrorsFor(message = '') {
  if (/incorrect username or password/i.test(message)) {
    return { form: 'Username or password is incorrect.' }
  }
  return { form: message }
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const expired = params.get('expired') === '1'

  useEffect(() => {
    document.title = 'Sign in — Briefly'
  }, [])

  useEffect(() => {
    if (status === 'authenticated') navigate('/', { replace: true })
  }, [status, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (error) {
      setErrors(fieldErrorsFor(error?.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-2">
      <AuthAside />

      <div className="grid min-h-dvh place-items-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-[360px]">
          <h1 className="font-reading text-lg font-semibold text-ink">Sign in</h1>

          {expired && (
            <p role="status" className="mt-3 text-xs text-graphite">
              Your session expired. Sign in again.
            </p>
          )}

          <div className="mt-6">
            <label htmlFor="username" className="mb-1.5 block text-2xs text-graphite">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-control border border-rule bg-sheet px-3 py-2 text-xs text-ink focus:border-teal"
            />
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
                autoComplete="current-password"
                required
                className="w-full rounded-control border border-rule bg-sheet py-2 pl-3 pr-10 text-xs text-ink focus:border-teal"
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
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-5 text-2xs text-graphite">
            New here?{' '}
            <Link to="/signup" className="text-teal underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
