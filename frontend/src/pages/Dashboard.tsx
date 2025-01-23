import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getProductStats, getLowStockProducts, getUsers, getOrders } from '../services/api'

interface OrderSummary {
  total: number
  count: number
  pending: number
}

interface UserSummary {
  total: number
  pending_approval: number
}

interface ProductSummary {
  total_products: number
  low_stock_products: number
  out_of_stock: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null)
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null)
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    fetchSummaries()
  }, [user, navigate])

  const fetchSummaries = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Fetch orders for all users
      const ordersResponse = await getOrders()
      const orders = ordersResponse.data
      const orderSummary = {
        total: orders.reduce((sum: number, order: any) => sum + order.total_amount, 0),
        count: orders.length,
        pending: orders.filter((order: any) => order.status === 'pending').length
      }
      setOrderSummary(orderSummary)

      // Only fetch product stats for managers and employees
      if (['MANAGER', 'EMPLOYEE'].includes(user.role)) {
        try {
          const productStatsResponse = await getProductStats()
          setProductSummary(productStatsResponse.data)
        } catch (err) {
          console.error('Error fetching product stats:', err)
          // Don't set error state here as this is optional for managers/employees
        }
      }

      // Only fetch user stats for managers
      if (user.role === 'MANAGER') {
        try {
          const usersResponse = await getUsers()
          const users = usersResponse.data
          const userSummary = {
            total: users.length,
            pending_approval: users.filter((user: any) => !user.is_approved).length
          }
          setUserSummary(userSummary)
        } catch (err) {
          console.error('Error fetching user stats:', err)
          // Don't set error state here as this is optional for managers
        }
      }
    } catch (err) {
      console.error('Error fetching summaries:', err)
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="text-center p-4">Please log in to view the dashboard.</div>
  }

  if (loading) {
    return <div className="text-center p-4">Loading dashboard...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Orders Summary */}
        {orderSummary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Orders</h2>
            <div className="space-y-2">
              <p>Total Orders: {orderSummary.count}</p>
              <p>Pending Orders: {orderSummary.pending}</p>
              <p>Total Revenue: ${Number(orderSummary.total).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Product Summary - Only for managers and employees */}
        {productSummary && ['MANAGER', 'EMPLOYEE'].includes(user.role) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <div className="space-y-2">
              <p>Total Products: {productSummary.total_products}</p>
              <p>Low Stock Products: {productSummary.low_stock_products}</p>
              <p>Out of Stock: {productSummary.out_of_stock}</p>
            </div>
          </div>
        )}

        {/* User Summary - Only for managers */}
        {userSummary && user.role === 'MANAGER' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="space-y-2">
              <p>Total Users: {userSummary.total}</p>
              <p>Pending Approval: {userSummary.pending_approval}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 