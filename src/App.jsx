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
import AdminCatalog from './pages/Catalog/AdminCatalog'
import FullCatalog from './pages/Catalog/FullCatalog'
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
import TechnicianDashboard from './pages/TechnicianDashboard'
import VisitorDashboard from './pages/VisitorDashboard'
import CalculatorTools from './pages/CalculatorTools'

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
              <Route path="/catalog" element={<FullCatalog />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/company" element={<CompanyProfile />} />
              <Route path="/tools" element={<CalculatorTools />} />
              {/* Visitor Dashboard — public route, self-manages auth check */}
              <Route path="/visitor-home" element={<VisitorDashboard />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><SalesDashboard /></ProtectedRoute>} />
              <Route path="/admin-catalog" element={<ProtectedRoute allowedRoles={['admin']}><AdminCatalog /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute allowedRoles={['visitor', 'admin', 'technician']}><Checkout /></ProtectedRoute>} />
              <Route path="/online-orders" element={<ProtectedRoute allowedRoles={['admin']}><OnlineOrders /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin']}><Inventory /></ProtectedRoute>} />
              <Route path="/inventory/:id" element={<ProtectedRoute allowedRoles={['admin']}><ProductDetails /></ProtectedRoute>} />
              <Route path="/service" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><ServiceMaintenance /></ProtectedRoute>} />
              <Route path="/technician" element={<ProtectedRoute allowedRoles={['technician', 'admin']}><TechnicianDashboard /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin']}><Customers /></ProtectedRoute>} />
              <Route path="/customers/:id" element={<ProtectedRoute allowedRoles={['admin']}><CustomerDetail /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute allowedRoles={['admin']}><Transactions /></ProtectedRoute>} />
              <Route path="/transactions/new" element={<ProtectedRoute allowedRoles={['admin']}><NewTransaction /></ProtectedRoute>} />
              <Route path="/transactions/:id" element={<ProtectedRoute allowedRoles={['admin', 'technician', 'visitor']}><InvoiceDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'technician', 'visitor']}><UserProfile /></ProtectedRoute>} />
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
