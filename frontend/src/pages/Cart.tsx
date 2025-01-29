import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../services/api';
import UserSelect from '../components/UserSelect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Minus, Trash } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LocationCheck } from '../components/LocationCheck';

const checkoutSchema = z.object({
  shipping_address: z.string().min(1, 'Shipping address is required'),
  payment_deadline: z.number().min(1).max(30, 'Payment deadline must be between 1 and 30 days')
});

export default function Cart() {
  const { user } = useAuth();
  const { items, total, loading, error, selectedUserId, setSelectedUserId, updateQuantity, removeItem, clearCart } = useCart();
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping_address: '',
      payment_deadline: 7
    }
  });

  const handleCheckout = async (data: z.infer<typeof checkoutSchema>) => {
    try {
      if (!user?.role) {
        setOrderError('User role not found. Please log in again.');
        return;
      }

      console.log('Checkout initiated with user role:', user.role);
      console.log('Location granted status:', locationGranted);
      
      if (['MANAGER', 'EMPLOYEE'].includes(user.role) && !locationGranted) {
        console.log('Location not granted for employee/manager');
        setOrderError('Location access is required to place orders');
        return;
      }

      setIsSubmitting(true);
      setOrderError('');

      const orderData = {
        shipping_address: data.shipping_address,
        payment_deadline: data.payment_deadline,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        ...(selectedUserId && { user_id: selectedUserId })
      };

      console.log('Sending order data from Cart:', orderData);
      await createOrder(orderData, user.role);
      await clearCart();
      form.reset();
      setOrderSuccess(true);
    } catch (error) {
      console.error('Checkout error:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-[100px]" />
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

  if (orderSuccess) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Order Placed Successfully!</CardTitle>
          <CardDescription>Thank you for your order.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => setOrderSuccess(false)}>
            Place Another Order
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (user?.role && ['MANAGER', 'EMPLOYEE'].includes(user.role) && !locationGranted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        <LocationCheck onLocationGranted={() => setLocationGranted(true)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {user && ['MANAGER', 'EMPLOYEE'].includes(user.role) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Selection</CardTitle>
            <CardDescription>Select a customer to place an order on their behalf</CardDescription>
          </CardHeader>
          <CardContent>
            <UserSelect
              selectedUserId={selectedUserId}
              onUserSelect={(userId) => {
                setSelectedUserId(userId);
                form.reset();
              }}
            />
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6 text-muted-foreground">
            Cart is empty
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">₹{Number(item.product.price).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="w-24 text-right font-medium">₹{Number(item.total).toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <Separator />
              <CardFooter className="justify-between py-4">
                <Button variant="outline" onClick={clearCart}>
                  Clear Cart
                </Button>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">₹{Number(total).toFixed(2)}</p>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>Complete your order</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shipping_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="payment_deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Deadline (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {orderError && (
                      <Alert variant="destructive">
                        <AlertDescription>{orderError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Placing Order...' : 'Checkout'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 