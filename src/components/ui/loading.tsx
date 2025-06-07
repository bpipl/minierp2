import { Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loading({ message = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-gray-600`} />
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}