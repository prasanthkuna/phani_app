import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import { getOrders, acceptOrder, rejectOrder, updateOrderStatus } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { format } from 'date-fns';

interface Order {
  id: number;
  user: {
    id: number;
    username: string;
    email?: string;
  };
  items: {
    id: number;
    product_detail: {
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_deadline: string;
  created_at: string;
  days_remaining: number;
  user_details?: {
    phone: string;
    address: string;
    role: string;
  };
  created_by_role?: string;
  location_display_name?: string;
  location_state?: string;
}

export default function Orders() {
  const { user } = useAuth();
  const { selectedCustomer } = useCustomer();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all_status',
    search: ''
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Handle immediate filter changes
  useEffect(() => {
    fetchOrders();
  }, [selectedCustomer, filters.status, debouncedSearch]); // Only fetch when these change

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Pass filters to getOrders function
      const response = await getOrders(selectedCustomer?.id, {
        status: filters.status !== 'all_status' ? filters.status : undefined,
        search: debouncedSearch || undefined
      });
      
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await acceptOrder(orderId);
      toast({
        title: 'Success',
        description: 'Order accepted successfully',
      });
      fetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept order',
        variant: 'destructive',
      });
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      await rejectOrder(orderId);
      toast({
        title: 'Success',
        description: 'Order rejected successfully',
      });
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject order',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600';
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
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
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Orders</h1>
          {selectedCustomer && ['MANAGER', 'EMPLOYEE'].includes(user?.role?.toUpperCase() || '') && (
            <div className="text-sm text-gray-500">
              Showing orders for: {selectedCustomer.username}
              {selectedCustomer.email && ` (${selectedCustomer.email})`}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by address, username, email, or product..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_status">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                No orders found
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className={`border-l-4 ${
                order.status.toLowerCase() === 'pending' ? 'border-l-yellow-500' :
                order.status.toLowerCase() === 'accepted' ? 'border-l-green-500' :
                order.status.toLowerCase() === 'rejected' ? 'border-l-red-500' :
                'border-l-gray-500'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Order #{order.id}
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          <span className={getStatusColor(order.status)}>
                            {order.status.toUpperCase()}
                          </span>
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-gray-500 mt-2 space-y-1">
                        <div className="font-medium">Customer Details:</div>
                        <div className="font-semibold text-gray-700">Customer: {order.user.username}</div>
                        {order.user.email && (
                          <div className="text-gray-600">Email: {order.user.email}</div>
                        )}
                        {order.user_details && (
                          <>
                            <div>Role: {order.user_details.role}</div>
                            <div>Phone: {order.user_details.phone || 'N/A'}</div>
                            <div>Address: {order.user_details.address || 'N/A'}</div>
                          </>
                        )}
                        {order.created_by_role && order.created_by_role !== order.user_details?.role && (
                          <div className="text-blue-600 mt-1">
                            Order placed by: {order.created_by_role.toLowerCase()}
                          </div>
                        )}
                        {order.location_display_name && (
                          <div className="mt-1">Location: {order.location_display_name}</div>
                        )}
                        {order.location_state && (
                          <div>State: {order.location_state}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        Total: ${Number(order.total_amount).toFixed(2)}
                      </div>
                      {user?.role === 'MANAGER' && order.status.toLowerCase() === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptOrder(order.id)}
                            className="border-green-500 hover:bg-green-50"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectOrder(order.id)}
                            className="border-red-500 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Items:</h3>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.product_detail.name} × {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Shipping Address:</h3>
                      <p className="text-sm text-gray-600">{order.shipping_address}</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>
                        Payment Deadline: {format(new Date(order.payment_deadline), 'MMM d, yyyy')}
                        {order.status.toLowerCase() === 'pending' && order.days_remaining > 0 && (
                          <span className="ml-2 text-green-600">
                            ({order.days_remaining} days remaining)
                          </span>
                        )}
                        {order.status.toLowerCase() === 'pending' && order.days_remaining <= 0 && (
                          <span className="ml-2 text-red-600">
                            (Overdue)
                          </span>
                        )}
                      </span>
                      <span>Ordered on: {format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 