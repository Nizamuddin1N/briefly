import { Suspense, lazy } from 'react'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { AuthProvider } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import LoginPage from './pages/LoginPage'

// Signed-in routes are split out so the markdown pipeline they pull in is not
// part of the sign-in page's bundle.
const SignupPage = lazy(() => import('./pages/SignupPage'))
const NewResearchPage = lazy(() => import('./pages/NewResearchPage'))
const TaskPage = lazy(() => import('./pages/TaskPage'))
const SavedReportPage = lazy(() => import('./pages/SavedReportPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function RouteFallback() {
  return (
    <p role="status" className="px-1 py-8 text-xs text-graphite">
      Loading…
    </p>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Session errors are handled by the axios interceptor, not by retrying.
      retry: false,
    },
  },
})

function ThemedToaster() {
  const { resolved } = useTheme()
  return <Toaster theme={resolved} position="bottom-right" richColors closeButton />
}

/** Protected pages all share the shell, so it lives on a layout route. */
function ShellLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Outlet />
      </AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              <Route element={<ShellLayout />}>
                <Route path="/" element={<NewResearchPage />} />
                <Route path="/task/:taskId" element={<TaskPage />} />
                <Route path="/report/:historyId" element={<SavedReportPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <ThemedToaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
