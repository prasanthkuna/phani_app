import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrders, updateOrderStatus } from '../services/api';

interface OrderItem {
  id: number;
  product_detail: {
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  status: string;
  total_amount: string | number;
  created_at: string;
  shipping_address: string;
  payment_deadline: number;
  items: OrderItem[];
  user_details?: {
    id: number;
    username: string;
    email: string;
    role: string;
    phone: string;
    address: string;
  };
}

interface FilterState {
  status: string;
  startDate: string;
  endDate: string;
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    startDate: '',
    endDate: ''
  });

  // Debounced fetch function
  const debouncedFetch = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.startDate) {
      params.append('start_date', filters.startDate);
    }
    if (filters.endDate) {
      params.append('end_date', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : '';

    setLoading(true);
    getOrders(url)
      .then(response => {
        setOrders(response.data);
        setError('');
      })
      .catch(err => {
        setError('Failed to fetch orders');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters]);

  // Debounced effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedFetch();
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [debouncedFetch]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      debouncedFetch(); // Use the same debounced fetch
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Order #{order.id}
                    </h2>
                    <p className="text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {(user?.role === 'MANAGER' || user?.role === 'EMPLOYEE') && order.user_details && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-gray-700">Customer Details:</p>
                        <p>Username: {order.user_details.username}</p>
                        <p>Email: {order.user_details.email}</p>
                        <p>Phone: {order.user_details.phone || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                  {user?.role === 'MANAGER' ? (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm"
                    >
                      {ORDER_STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  )}
                </div>

                <div className="border-t border-b py-4 mb-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2"
                    >
                      <div>
                        <p className="font-medium">{item.product_detail.name}</p>
                        <p className="text-gray-500">
                          Quantity: {item.quantity} × ${item.price}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium mb-1">Shipping Address:</p>
                    <p className="text-gray-600 whitespace-pre-line">
                      {order.shipping_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-bold">
                      ${Number(order.total_amount).toFixed(2)}
                    </p>
                    {order.payment_deadline && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Payment Due</p>
                        <p className="text-sm">
                          {(() => {
                            const createdDate = new Date(order.created_at);
                            const dueDate = new Date(createdDate);
                            dueDate.setDate(dueDate.getDate() + order.payment_deadline);
                            const today = new Date();
                            const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <>
                                <span className={`font-medium ${daysRemaining > 3 ? 'text-green-600' : daysRemaining > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Payment Overdue'}
                                </span>
                                <br />
                                <span className="text-gray-500">
                                  Due by {dueDate.toLocaleDateString()}
                                </span>
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 