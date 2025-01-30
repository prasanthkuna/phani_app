import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Link to="/" className="text-gray-800 hover:text-gray-600">
                Home
              </Link>
              {user && (
                <>
                  <Link to="/products" className="text-gray-800 hover:text-gray-600">
                    Products
                  </Link>
                  <Link to="/orders" className="text-gray-800 hover:text-gray-600">
                    Orders
                  </Link>
                  <Link to="/dashboard" className="text-gray-800 hover:text-gray-600">
                    Dashboard
                  </Link>
                  {user.role === 'MANAGER' && (
                    <Link to="/users" className="text-gray-800 hover:text-gray-600">
                      User Management
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/cart" className="text-gray-800 hover:text-gray-600 relative">
                    Cart
                    {items.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {items.length}
                      </span>
                    )}
                  </Link>
                  <span className="text-gray-600">{user.username}</span>
                  <button
                    onClick={logout}
                    className="text-gray-800 hover:text-gray-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-800 hover:text-gray-600">
                    Login
                  </Link>
                  <Link to="/register" className="text-gray-800 hover:text-gray-600">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 