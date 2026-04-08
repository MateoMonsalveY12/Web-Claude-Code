import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export function useAdminAuth() {
  const [authenticated, setAuthenticated] = useState(null) // null = loading
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetch('/api/admin/check', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          setAuthenticated(true)
        } else {
          setAuthenticated(false)
          if (location.pathname !== '/admin/login') {
            navigate('/admin/login', { replace: true })
          }
        }
      })
      .catch(() => {
        setAuthenticated(false)
        navigate('/admin/login', { replace: true })
      })
  }, [])

  return { authenticated, loading: authenticated === null }
}
