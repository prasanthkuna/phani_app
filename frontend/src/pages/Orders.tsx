import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrders, updateOrderStatus } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Separator } from '../components/ui/separator';

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
  location_state?: string;
  location_display_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  created_by_role?: string;
}

interface FilterState {
  status: string;
  startDate: string;
  endDate: string;
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ALL_STATUSES = 'all';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedFetch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [debouncedFetch]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      debouncedFetch();
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-[100px] mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by status and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || ALL_STATUSES}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === ALL_STATUSES ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                  {ORDER_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6 text-muted-foreground">
            No orders found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <CardDescription>
                      {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {user?.role === 'MANAGER' ? (
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={order.status.charAt(0).toUpperCase() + order.status.slice(1)} />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  )}
                </div>
                {(user?.role === 'MANAGER' || user?.role === 'EMPLOYEE') && order.user_details && (
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="font-medium">Customer Details:</p>
                    <p>Username: {order.user_details.username}</p>
                    <p>Email: {order.user_details.email}</p>
                    <p>Phone: {order.user_details.phone || 'N/A'}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_detail.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <p className="font-medium">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="mt-4">
                <div className="flex justify-between items-start w-full">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium mb-1">Shipping Address:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {order.shipping_address}
                      </p>
                    </div>
                    {user?.role === 'MANAGER' && order.created_by_role !== 'CUSTOMER' && (
                      <div>
                        <p className="font-medium mb-1">Location Details:</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>State: {order.location_state}</p>
                          <p className="whitespace-pre-line">Full Address: {order.location_display_name}</p>
                          <p className="text-xs">
                            Coordinates: {order.location_latitude ? Number(order.location_latitude).toFixed(5) : 'N/A'}, {order.location_longitude ? Number(order.location_longitude).toFixed(5) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </p>
                    {order.payment_deadline && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Payment Due</p>
                        {(() => {
                          const createdDate = new Date(order.created_at);
                          const dueDate = new Date(createdDate);
                          dueDate.setDate(dueDate.getDate() + order.payment_deadline);
                          const today = new Date();
                          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div className="text-sm">
                              <p className={`font-medium ${
                                daysRemaining > 3 ? 'text-green-600' : 
                                daysRemaining > 0 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Payment Overdue'}
                              </p>
                              <p className="text-muted-foreground">
                                Due by {dueDate.toLocaleDateString()}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 