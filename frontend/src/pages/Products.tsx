import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Minus, Edit, Trash } from 'lucide-react';
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
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
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
  }, []);

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
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Handle basic fields
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('price', values.price);
      formData.append('stock', values.stock.toString());

      // Handle image fields
      if (values.image) {
        formData.append('image', values.image);
      }
      
      // Only append image_url if it's not empty
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
      <div className="flex justify-between items-center mb-6">
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
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            {...field}
                            onChange={(e) => {
                              let value = e.target.value;
                              // Allow only numbers and one decimal point
                              value = value.replace(/[^\d.]/g, '');
                              // Prevent multiple decimal points
                              const parts = value.split('.');
                              if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                              // Limit decimal places to 2
                              if (parts[1]) parts[1] = parts[1].slice(0, 2);
                              value = parts.join('.');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
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
                    <Button type="submit">
                      {editingProduct ? 'Update' : 'Add'} Product
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col h-full">
            <CardHeader className="flex-none">
              <div className="relative h-48">
                {(product.image_url || product.image) ? (
                  <img
                    src={product.image_url || product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardTitle className="mt-2 text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              <div className="mt-4">
                <p className="font-semibold">₹{Number(product.price).toFixed(2)}</p>
                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
              </div>
            </CardContent>
            <CardFooter className="flex-none space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingProduct(product);
                  setShowAddForm(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 