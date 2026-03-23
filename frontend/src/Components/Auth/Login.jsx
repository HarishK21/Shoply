import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storeAuthSession } from '../../lib/auth'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setErrorMessage('')
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(result.message || 'Login failed')
        return
      }

      const didStoreSession = storeAuthSession({ token: result.token, user: result.user })
      if (!didStoreSession) {
        setErrorMessage('Login response is missing a session token. Restart backend and try again.')
        return
      }

      // go to home page
      navigate('/home')
    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('Unable to reach the server. Please try again.')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-button arcade-btn">Login</button>
        </form>

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
