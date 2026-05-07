import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Memuat...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // Check if role is allowed (if allowedRoles is specified)
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`Access denied for role: ${role}. Required: ${allowedRoles}`)
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
