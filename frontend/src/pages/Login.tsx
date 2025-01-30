import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthForm from '../components/auth/AuthForm'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'

export default function Login() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, user } = useAuth()

  const handleSubmit = async (data: any) => {
    setError('')
    try {
      await login(data.username, data.password)
      // After login, user state will be updated
      if (user?.role === 'employee') {
        navigate('/products')
      } else if (user?.role === 'manager') {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.')
    }
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AuthForm mode="login" onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
} 