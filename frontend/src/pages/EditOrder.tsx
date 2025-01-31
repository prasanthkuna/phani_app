import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOrder, updateOrder, getProducts } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const editOrderSchema = z.object({
  shipping_address: z.string().min(1, 'Shipping address is required'),
  payment_deadline: z.number().min(1).max(30, 'Payment deadline must be between 1 and 30 days')
});

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
  total: number;
}

export default function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [total, setTotal] = useState(0);

  const form = useForm({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      shipping_address: '',
      payment_deadline: 7
    }
  });

  useEffect(() => {
    if (user?.role !== 'MANAGER') {
      navigate('/orders');
      return;
    }

    const fetchData = async () => {
      try {
        const [orderResponse, productsResponse] = await Promise.all([
          getOrder(Number(id)),
          getProducts()
        ]);

        // Check if order is not pending
        if (orderResponse.data.status !== 'pending') {
          toast({
            title: 'Error',
            description: 'Only pending orders can be edited',
            variant: 'destructive',
          });
          navigate('/orders');
          return;
        }

        setProducts(productsResponse.data);
        
        // Transform order items to match our format
        const items = orderResponse.data.items.map((item: any) => ({
          id: item.id,
          product_id: item.product_detail.id,
          quantity: item.quantity,
          product: {
            id: item.product_detail.id,
            name: item.product_detail.name,
            price: item.price,
            stock: item.product_detail.stock || 0
          },
          total: item.quantity * item.price
        }));
        
        setOrderItems(items);
        calculateTotal(items);
        
        form.reset({
          shipping_address: orderResponse.data.shipping_address,
          payment_deadline: orderResponse.data.payment_deadline
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive',
        });
        navigate('/orders');
      }
    };

    fetchData();
  }, [id, navigate, user, form]);

  const calculateTotal = (items: OrderItem[]) => {
    const newTotal = items.reduce((sum, item) => sum + Number(item.total), 0);
    setTotal(newTotal);
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const productId = parseInt(selectedProduct);
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = orderItems.find(item => item.product_id === productId);
    if (existingItem) {
      handleUpdateQuantity(productId, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: Date.now(), // temporary id for new items
        product_id: product.id,
        quantity: 1,
        product,
        total: Number(product.price) // Ensure total is a number
      };
      const newItems = [...orderItems, newItem];
      setOrderItems(newItems);
      calculateTotal(newItems);
    }
    setSelectedProduct('');
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const product = products.find(p => p.id === productId);
    if (!product || newQuantity > product.stock) {
      toast({
        title: 'Error',
        description: 'Quantity exceeds available stock',
        variant: 'destructive',
      });
      return;
    }

    const newItems = orderItems.map(item => 
      item.product_id === productId 
        ? { 
            ...item, 
            quantity: newQuantity, 
            total: Number(item.product.price) * newQuantity // Ensure total is a number
          }
        : item
    );
    setOrderItems(newItems);
    calculateTotal(newItems);
  };

  const handleRemoveItem = (productId: number) => {
    const newItems = orderItems.filter(item => item.product_id !== productId);
    setOrderItems(newItems);
    calculateTotal(newItems);
  };

  const onSubmit = async (data: z.infer<typeof editOrderSchema>) => {
    try {
      await updateOrder(Number(id), {
        shipping_address: data.shipping_address,
        payment_deadline: data.payment_deadline,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      });

      toast({
        title: 'Success',
        description: 'Order updated successfully',
      });
      navigate('/orders');
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Order #{id}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add or modify order items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - ₹{product.price} (Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddProduct}>Add Product</Button>
              </div>

              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">₹{item.product.price} each</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="w-24 text-right font-medium">₹{item.total.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.product_id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <Separator />
            <CardFooter className="justify-end py-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{total.toFixed(2)}</p>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Update order information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/orders')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 