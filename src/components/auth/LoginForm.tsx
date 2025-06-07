import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { Loader2, Wifi, RefreshCw } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { signIn, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      setIsRetrying(false)
      const result = await signIn(data.email, data.password)
      
      if (!result.success) {
        setError(result.error || 'Login failed')
        
        // If it's a network error, show retry option
        if (result.error?.includes('network') || result.error?.includes('Load failed') || result.error?.includes('connection')) {
          setIsRetrying(true)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleRetry = () => {
    setError(null)
    setIsRetrying(false)
    // Trigger form submission again
    handleSubmit(onSubmit)()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sign in to Mini-ERP
            </CardTitle>
            <CardDescription className="text-center">
              Order Management QC App
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    {isRetrying && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRetry}
                        className="ml-2"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Connection Status */}
            <div className="flex justify-center">
              <ConnectionStatus />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@company.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Internal company access only</p>
              <p className="mt-1">Contact admin for account access</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}