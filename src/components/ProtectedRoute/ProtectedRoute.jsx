import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    return <Navigate to="/login" replace />
  }

  // If role is visitor or null, and the route doesn't explicitly allow visitor role, redirect to visitor home
  if ((role === 'visitor' || role === null) && (!allowedRoles || !allowedRoles.includes('visitor'))) {
    return <Navigate to="/service-order" replace />
  }

  // If role is technician and trying to access an admin-only page (role not in allowedRoles), redirect to technician dashboard
  if (role === 'technician' && allowedRoles && !allowedRoles.includes('technician')) {
    return <Navigate to="/technician" replace />
  }

  // Check if role is allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`Access denied for role: ${role}. Required: ${allowedRoles}`)
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

