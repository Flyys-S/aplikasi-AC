import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import OnlineOrders from './pages/OnlineOrders'
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
import CompanyProfile from './pages/CompanyProfile'
import UserProfile from './pages/UserProfile/Profile.jsx'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <Toaster position="top-center" />
          <Router basename="/aplikasi-AC">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Catalog />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/company" element={<CompanyProfile />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><SalesDashboard /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/online-orders" element={<ProtectedRoute><OnlineOrders /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin']}><Inventory /></ProtectedRoute>} />
              <Route path="/inventory/:id" element={<ProtectedRoute allowedRoles={['admin']}><ProductDetails /></ProtectedRoute>} />
              <Route path="/service" element={<ProtectedRoute><ServiceMaintenance /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/transactions/new" element={<ProtectedRoute><NewTransaction /></ProtectedRoute>} />
              <Route path="/transactions/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
