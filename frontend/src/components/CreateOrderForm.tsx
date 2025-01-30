import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomerSelect } from '../hooks/useCustomerSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { toast } from "./ui/use-toast";
import { createOrder } from '../services/api';

interface CreateOrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  const { user } = useAuth();
  const { customers, loading: loadingCustomers } = useCustomerSelect({
    userRole: user?.role || '',
    userId: user?.id || 0
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast({
        title: 'Error',
        description: 'Please select a customer',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await createOrder({
        user_id: parseInt(selectedCustomerId),
        shipping_address: shippingAddress,
        items: [], // Add your items logic here
        payment_deadline: 7
      }, user?.role || 'CUSTOMER');
      toast({
        title: 'Success',
        description: 'Order created successfully',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCustomers) {
    return <div>Loading customers...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(user?.role === 'MANAGER' || user?.role === 'EMPLOYEE') && (
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select
            value={selectedCustomerId}
            onValueChange={setSelectedCustomerId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.username} ({customer.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="shipping_address">Shipping Address</Label>
        <Input
          id="shipping_address"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          placeholder="Enter shipping address"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
} 
