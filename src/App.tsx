import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { QueryProvider } from '@/providers/QueryProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Orders } from '@/pages/Orders'
import { Settings } from '@/pages/Settings'
import { LabelDesignerPage } from '@/pages/LabelDesignerPage'
import { Loading } from '@/components/ui/loading'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cleanupOrdersSubscriptions } from '@/hooks/useOrders'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Loading message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Loading message="Initializing Mini-ERP..." />
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/preferences" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/label-designer" element={
        <ProtectedRoute>
          <DashboardLayout>
            <LabelDesignerPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Add more routes as we build more pages */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  // Cleanup subscriptions when app unmounts
  useEffect(() => {
    return () => {
      cleanupOrdersSubscriptions()
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryProvider>
          <AppContent />
          <Toaster />
        </QueryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App