import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCustomer } from '../contexts/CustomerContext';
import { getProducts, createProduct, updateProduct, deleteProduct, getCustomers } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Minus, Edit, Trash } from 'lucide-react';
import UserSelect from '../components/UserSelect';
import { User } from '../types/user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '../components/ui/use-toast';
import axios from 'axios';
import { ImageIcon } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  image?: string;
  is_active?: boolean;
}

interface ProductQuantity {
  [key: number]: number;
}

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string(),
  stock: z.number().min(0, 'Stock must be non-negative'),
  image_url: z.string().optional(),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Products() {
  const { user } = useAuth();
  const { addToCart, setSelectedUserId } = useCart();
  const { selectedCustomer, setSelectedCustomer } = useCustomer();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quantities, setQuantities] = useState<ProductQuantity>({});
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stock: 0,
      image_url: '',
      image: null
    }
  });

  useEffect(() => {
    fetchProducts();
    if (['MANAGER', 'EMPLOYEE'].includes(user?.role || '')) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price.toString(),
        stock: editingProduct.stock,
        image_url: editingProduct.image_url || '',
        image: null
      });
    }
  }, [editingProduct, form]);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data.filter((product: Product) => product.is_active !== false));
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getCustomers();
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load customers');
    }
  };

  const handleUserSelect = (userId: number | null) => {
    if (userId) {
      const selectedUser = users.find((u: User) => u.id === userId);
      setSelectedCustomer(selectedUser || null);
      setSelectedUserId(userId);
      setQuantities({});
    } else {
      setSelectedCustomer(null);
      setSelectedUserId(null);
      setQuantities({});
    }
  };

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('price', values.price);
      formData.append('stock', values.stock.toString());

      if (values.image) {
        formData.append('image', values.image);
      }
      
      if (values.image_url && values.image_url.trim() !== '') {
        formData.append('image_url', values.image_url);
      }

      let response;
      if (editingProduct) {
        response = await updateProduct(editingProduct.id, formData);
      } else {
        response = await createProduct(formData);
      }

      if (response.status === 200 || response.status === 201) {
        toast({
          title: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
          variant: 'success',
        });
        form.reset();
        setEditingProduct(null);
        setShowAddForm(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
      console.error(err);
    }
  };

  const handleQuantityChange = (productId: number, change: number) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 1;
      const newQty = Math.max(1, Math.min(currentQty + change, 
        products.find(p => p.id === productId)?.stock || 1));
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const quantity = quantities[product.id] || 1;
      await addToCart(product.id, quantity);
      setQuantities(prev => ({ ...prev, [product.id]: 1 }));
      toast({
        title: 'Added to cart',
        description: `${quantity} x ${product.name} added to cart`,
        variant: 'success',
      });
    } catch (err) {
      setError('Failed to add item to cart');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Products</h1>
          {user?.role === 'MANAGER' && (
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingProduct(null);
                  form.reset();
                }}>
                  Add New Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit' : 'Add'} Product</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              {...field}
                              onChange={(e) => {
                                let value = e.target.value;
                                value = value.replace(/[^\d.]/g, '');
                                const parts = value.split('.');
                                if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                                if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                value = parts.join('.');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Product Image</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              }}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Upload a product image (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://example.com/image.jpg"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Or provide an external image URL
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-4">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {editingProduct ? 'Update' : 'Add'} Product
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{product.name}</span>
                  {user?.role === 'MANAGER' && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowAddForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <p className="font-semibold">Price: ${product.price}</p>
                  <p>Stock: {product.stock}</p>
                  {(product.image_url || product.image) && (
                    <div className="relative h-48 w-full">
                      <img
                        src={product.image_url || product.image}
                        alt={product.name}
                        className="object-cover w-full h-full rounded-md"
                      />
                    </div>
                  )}
                  {!product.image_url && !product.image && (
                    <div className="relative h-48 w-full bg-gray-100 rounded-md flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, -1)}
                    disabled={quantities[product.id] <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span>{quantities[product.id] || 1}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, 1)}
                    disabled={quantities[product.id] >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 