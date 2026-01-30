import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Sites from '@/pages/Sites'
import Logs from '@/pages/Logs'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono">LOADING SYSTEM...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites"
        element={
          <ProtectedRoute>
            <Sites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#000',
                color: '#10b981',
                border: '2px solid #10b981',
                fontFamily: 'monospace',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#000',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
