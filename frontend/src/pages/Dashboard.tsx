import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getProductStats, getLowStockProducts, getUserStats, getOrders } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Skeleton } from '../components/ui/skeleton'

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
          const userStatsResponse = await getUserStats()
          setUserSummary({
            total: userStatsResponse.data.total_users,
            pending_approval: userStatsResponse.data.pending_approval
          })
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
    return (
      <Alert>
        <AlertDescription>Please log in to view the dashboard.</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Orders Summary */}
        {orderSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Overview of order statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-medium">{orderSummary.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Orders:</span>
                <span className="font-medium">{orderSummary.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-medium">${Number(orderSummary.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Summary - Only for managers and employees */}
        {productSummary && ['MANAGER', 'EMPLOYEE'].includes(user.role) && (
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Overview of product statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Products:</span>
                <span className="font-medium">{productSummary.total_products}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Products:</span>
                <span className="font-medium">{productSummary.low_stock_products}</span>
              </div>
              <div className="flex justify-between">
                <span>Out of Stock:</span>
                <span className="font-medium">{productSummary.out_of_stock}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Summary - Only for managers */}
        {userSummary && user.role === 'MANAGER' && (
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Overview of user statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-medium">{userSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Approval:</span>
                <span className="font-medium">{userSummary.pending_approval}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 