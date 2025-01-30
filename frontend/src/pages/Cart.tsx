import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import { createOrder } from '../services/api';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LocationCheck } from '../components/LocationCheck';
import { toast } from '../components/ui/use-toast';

const checkoutSchema = z.object({
  shipping_address: z.string().min(1, 'Shipping address is required'),
  payment_deadline: z.number().min(1).max(30, 'Payment deadline must be between 1 and 30 days')
});

export default function Cart() {
  const { user } = useAuth();
  const { selectedCustomer } = useCustomer();
  const { items, total, loading, error, updateQuantity, removeItem, clearCart } = useCart();
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping_address: selectedCustomer?.address || '',
      payment_deadline: 7
    }
  });

  // Update shipping address when selected customer changes
  useEffect(() => {
    if (selectedCustomer?.address) {
      form.setValue('shipping_address', selectedCustomer.address);
    }
  }, [selectedCustomer, form]);

  const handleCheckout = async (data: z.infer<typeof checkoutSchema>) => {
    try {
      if (!user?.role) {
        setOrderError('User role not found. Please log in again.');
        return;
      }

      // Only check location and customer selection for managers and employees
      if (['MANAGER', 'EMPLOYEE'].includes(user.role.toUpperCase())) {
        if (!locationGranted) {
          setOrderError('Location access is required to place orders');
          return;
        }
        if (!selectedCustomer) {
          setOrderError('Please select a customer before placing the order');
          return;
        }
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
        // Only include user_id if we're a manager/employee placing order for customer
        ...(selectedCustomer && ['MANAGER', 'EMPLOYEE'].includes(user.role.toUpperCase()) && { user_id: selectedCustomer.id })
      };

      await createOrder(orderData, user.role);
      await clearCart();
      form.reset({
        shipping_address: selectedCustomer?.address || '',
        payment_deadline: 7
      });
      setOrderSuccess(true);
      toast({
        title: 'Success',
        description: 'Order placed successfully!',
        variant: 'success',
      });
    } catch (error) {
      console.error('Checkout error:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearCart = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = async () => {
    try {
      await clearCart();
      toast({
        title: 'Success',
        description: 'Cart cleared successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setShowClearConfirm(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Only show LocationCheck when user is manager/employee */}
      {user && ['MANAGER', 'EMPLOYEE'].includes(user.role.toUpperCase()) && (
        <div className="mb-4">
          <LocationCheck 
            onLocationGranted={setLocationGranted}
            showSuccessMessage={false} // Only show success message on initial grant
          />
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cart</h1>
          {/* Only show selected customer info for managers and employees */}
          {selectedCustomer && ['MANAGER', 'EMPLOYEE'].includes(user?.role?.toUpperCase() || '') && (
            <div className="text-sm text-gray-500">
              Order for: {selectedCustomer.username}
              {selectedCustomer.email && ` (${selectedCustomer.email})`}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                Your cart is empty
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="py-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Cart Items</h2>
                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    disabled={items.length === 0}
                  >
                    Clear Cart
                  </Button>
                </div>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div className="flex-grow">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${item.product.price} × {item.quantity} = ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
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
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="py-4">
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">
                    ${items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>Complete your order</CardDescription>
              </CardHeader>
              <CardContent>
                {orderError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{orderError}</AlertDescription>
                  </Alert>
                )}
                {orderSuccess ? (
                  <Alert className="mb-4">
                    <AlertDescription>Order placed successfully!</AlertDescription>
                  </Alert>
                ) : (
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
                                onChange={e => field.onChange(Number(e.target.value))}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-4">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Placing Order...' : 'Place Order'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearCart}>Clear Cart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 