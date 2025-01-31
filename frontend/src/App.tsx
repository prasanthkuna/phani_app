import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { CartProvider } from './contexts/CartContext'
import { Toaster } from './components/ui/toaster'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import UserManagement from './pages/UserManagement'
import Layout from './components/Layout'
import ProtectedRoute, { ProtectedRouteProps } from './components/ProtectedRoute'

const ProtectedRouteWithRedirect: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // For employees, redirect to products page
  if (user.role === 'employee' && window.location.pathname === '/') {
    return <Navigate to="/products" />;
  }

  // For managers, keep dashboard as default
  if (user.role === 'manager' && window.location.pathname === '/') {
    return <Navigate to="/dashboard" />;
  }

  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CustomerProvider>
          <CartProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<Layout><Outlet /></Layout>}>
                <Route path="/" element={
                  <ProtectedRouteWithRedirect>
                    <Dashboard />
                  </ProtectedRouteWithRedirect>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRouteWithRedirect roles={['manager']}>
                    <Dashboard />
                  </ProtectedRouteWithRedirect>
                } />
                <Route path="/products" element={
                  <ProtectedRouteWithRedirect>
                    <Products />
                  </ProtectedRouteWithRedirect>
                } />
                <Route path="/cart" element={
                  <ProtectedRouteWithRedirect>
                    <Cart />
                  </ProtectedRouteWithRedirect>
                } />
                <Route path="/orders" element={
                  <ProtectedRouteWithRedirect>
                    <Orders />
                  </ProtectedRouteWithRedirect>
                } />
                <Route path="/users" element={
                  <ProtectedRouteWithRedirect roles={['manager']}>
                    <UserManagement />
                  </ProtectedRouteWithRedirect>
                } />
              </Route>
            </Routes>
            <Toaster />
          </CartProvider>
        </CustomerProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
