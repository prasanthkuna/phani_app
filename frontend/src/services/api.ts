import axios from 'axios';
import { LocationData, getCurrentLocation } from './location';

const API_URL = 'http://localhost:8000/api';

// Create a separate axios instance for getting CSRF token
const csrfAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Auth endpoints and functions
export const getCSRFToken = async () => {
  try {
    await csrfAxios.get('/auth/csrf/');
    // Wait to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the token from cookies
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken'))
      ?.split('=')[1];

    if (!token) {
      throw new Error('CSRF token not found in cookies');
    }

    return token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

// Session management
export const checkSession = () => api.get('/auth/session/');

// Add request interceptor to handle CSRF token and session
api.interceptors.request.use(
  async (config) => {
    // Add trailing slash to URLs that don't have one, but only before query parameters
    if (typeof config.url === 'string') {
      const [path, query] = config.url.split('?');
      if (!path.endsWith('/')) {
        config.url = query ? `${path}/?${query}` : `${path}/`;
      }
    }

    // For non-GET requests or sensitive GET requests, ensure CSRF token exists
    if (config.method !== 'get' || 
        (typeof config.url === 'string' && 
         (config.url.includes('stats') || config.url.includes('users') || config.url.includes('cart') || config.url.includes('orders')))) {
      try {
        const token = await getCSRFToken();
        config.headers['X-CSRFToken'] = token;
      } catch (error) {
        console.error('Failed to set CSRF token:', error);
        throw error;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if it's already a retry or if it's a 401 (Unauthorized)
    if (error.response?.status === 401) {
      // Clear any stored auth data
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 errors (CSRF token issues or permission issues)
    if (error.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        // If another request is already refreshing, add this request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // First try to refresh CSRF token
        await getCSRFToken();
        
        try {
          // Then check if session is still valid
          await checkSession();
          // If we get here, session is valid
          processQueue();
          return api(originalRequest);
        } catch (sessionError) {
          // Session is invalid
          processQueue(error);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If both CSRF refresh and session check fail, redirect to login
        processQueue(refreshError);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const register = async (data: {
  username: string;
  email?: string;
  password: string;
  password2: string;
  role: string;
}) => {
  // First, get CSRF token
  await getCSRFToken();
  // Then make registration request
  return api.post('/auth/register/', data);
};

export const login = async (username: string, password: string) => {
  // First, get CSRF token
  await getCSRFToken();
  // Then make login request
  return api.post('/auth/login/', { username, password });
};

export const logout = () => api.post('/auth/logout/');

// Product endpoints
export const getProducts = () => api.get('/products/');
export const getProduct = (id: number) => api.get(`/products/${id}/`);
export const createProduct = (data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  return api.post('/products/', data, config);
};
export const updateProduct = (id: number, data: FormData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  return api.patch(`/products/${id}/`, data, config);
};
export const deleteProduct = (id: number) => api.delete(`/products/${id}/`);
export const getLowStockProducts = () => api.get('/products/low_stock/');
export const getProductStats = () => api.get('/products/stats/');

// Order endpoints
export const getOrders = (userId?: number, filters?: { status?: string; search?: string }) => {
  const params = new URLSearchParams();
  
  if (userId) params.append('user_id', userId.toString());
  if (filters?.status && filters.status !== 'all_status') params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  return api.get(`/orders/${queryString ? `?${queryString}` : ''}`);
};

export const getOrder = (id: number) => api.get(`/orders/${id}/`);

interface UpdateOrderData {
  shipping_address?: string;
  payment_deadline?: number;
  items?: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export const updateOrder = (id: number, data: UpdateOrderData) => api.patch(`/orders/${id}/update_order/`, data);

export const acceptOrder = (id: number) => api.post(`/orders/${id}/accept/`);
export const rejectOrder = (id: number) => api.post(`/orders/${id}/reject/`);

interface CreateOrderItem {
  product_id: number;
  quantity: number;
}

interface CreateOrderData {
  shipping_address: string;
  payment_deadline: number;
  items: CreateOrderItem[];
  user_id?: number;
  location_state?: string;
  location_display_name?: string;
  location_latitude?: number;
  location_longitude?: number;
}

export const createOrder = async (data: CreateOrderData, userRole: string) => {
  await getCSRFToken();
  
  console.log('Creating order as logged-in user with role:', userRole);
  
  // Check if logged-in user is employee/manager
  if (['MANAGER', 'EMPLOYEE'].includes(userRole)) {
    console.log('Logged-in user is employee/manager, getting location...');
    try {
      const location = await getCurrentLocation();
      console.log('Got location data:', location);
      
      const orderData: CreateOrderData = {
        ...data,
        location_state: location.state,
        location_display_name: location.display_name,
        location_latitude: location.latitude,
        location_longitude: location.longitude
      };
      console.log('Final order data with location:', orderData);
      return api.post('/orders/', orderData);
    } catch (error) {
      console.error('Error getting location for order:', error);
      throw new Error('Location access is required for employees and managers to place orders.');
    }
  }
  
  // For customers, proceed without location
  console.log('Sending order data without location for customer:', data);
  return api.post('/orders/', data);
};

export const updateOrderStatus = (id: number, status: string) => api.patch(`/orders/${id}/`, { status });

// User endpoints
export const getUsers = async (queryParams: string = '') => {
  return api.get(`/admin/manage/${queryParams ? `?${queryParams}` : ''}`);
};

export const getCustomers = () => api.get('/users/get_customers/');
export const approveUser = (id: number) => api.patch(`/admin/manage/${id}/update_status/`, { status: 'ACTIVE' });
export const updateUserRole = async (userId: number, role: string) => {
  return api.patch(`/admin/manage/${userId}/update_role/`, { role });
};
export const resetUserPassword = async (userId: number, newPassword: string) => {
  return api.post(`/admin/manage/${userId}/reset_password/`, { new_password: newPassword });
};
export const getUserStats = () => api.get('/users/stats/');

// User Management
export const updateUserStatus = async (userId: number, status: string) => {
  return api.patch(`/admin/manage/${userId}/update_status/`, { status });
};

// Employee-Customer Assignment endpoints
export const assignCustomersToEmployee = async (employeeId: number, customerIds: number[]) => {
  return api.post(`/admin/manage/${employeeId}/assign_customers/`, { customer_ids: customerIds });
};

export const getEmployeeCustomers = async (employeeId: number) => {
  return api.get(`/admin/manage/${employeeId}/get_employee_customers/`);
};

export const getUnassignedCustomers = async () => {
  return api.get('/admin/manage/unassigned_customers/');
};

export const unassignCustomerFromEmployee = async (employeeId: number, customerId: number) => {
  return api.post(`/admin/manage/${employeeId}/unassign_customer/`, { customer_id: customerId });
};

export const getCustomerAssignments = async (customerId: number) => {
  return api.get(`/admin/manage/${customerId}/get_customer_assignments/`);
};

// Cart endpoints
export const getCart = async (userId?: number) => {
  await getCSRFToken();
  return api.get(userId ? `/shopping-cart/?user_id=${userId}` : '/shopping-cart/');
};

export const addToCart = async (productId: number, quantity: number = 1, userId?: number) => {
  await getCSRFToken();
  const data = { product_id: productId, quantity };
  return api.post(userId ? `/shopping-cart/add_item/?user_id=${userId}` : '/shopping-cart/add_item/', data);
};

export const updateCartItem = async (productId: number, quantity: number, userId?: number) => {
  await getCSRFToken();
  const data = { product_id: productId, quantity };
  return api.post(userId ? `/shopping-cart/update_item/?user_id=${userId}` : '/shopping-cart/update_item/', data);
};

export const removeFromCart = async (productId: number, userId?: number) => {
  await getCSRFToken();
  const data = { product_id: productId };
  return api.post(userId ? `/shopping-cart/remove_item/?user_id=${userId}` : '/shopping-cart/remove_item/', data);
};

export const clearCart = async (userId?: number) => {
  await getCSRFToken();
  return api.post(userId ? `/shopping-cart/clear/?user_id=${userId}` : '/shopping-cart/clear/');
};

export default api; 