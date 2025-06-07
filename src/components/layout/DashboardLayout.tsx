import { ReactNode } from 'react'
import { NavigationWithSubmenus } from './NavigationWithSubmenus'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationWithSubmenus />
      <main className="w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}