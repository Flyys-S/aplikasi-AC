import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import SalesDashboard from './pages/SalesDashboard'
import Inventory from './pages/Inventory'
import ProductDetails from './pages/ProductDetails'
import ServiceMaintenance from './pages/ServiceMaintenance'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Transactions from './pages/Transactions'
import NewTransaction from './pages/NewTransaction'
import InvoiceDetail from './pages/InvoiceDetail'
import SignUp from './pages/SignUp'
import UserManagement from './pages/UserManagement'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><SalesDashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
          <Route path="/service" element={<ProtectedRoute><ServiceMaintenance /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/transactions/new" element={<ProtectedRoute><NewTransaction /></ProtectedRoute>} />
          <Route path="/transactions/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
