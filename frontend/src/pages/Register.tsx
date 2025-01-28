import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthForm from '../components/auth/AuthForm'

export default function Register() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (data: any) => {
    try {
      await register(data)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2 className="text-2xl font-bold text-green-600 mb-4 text-center">Account Created Successfully!</h2>
          <p className="text-gray-600 text-center mb-4">
            Your account has been created. You can login once your account is approved by an administrator.
          </p>
          <p className="text-gray-500 text-center">
            Redirecting to login page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <AuthForm mode="register" onSubmit={handleSubmit} />
    </div>
  )
} 