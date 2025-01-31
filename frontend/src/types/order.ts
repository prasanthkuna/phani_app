export interface Order {
  shipping_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  created_by_role: string;
  location_state?: string;
  location_display_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  payment_deadline: number;
  days_remaining: number;
  items: Array<{
    id: number;
    product_detail: {
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  user_details?: {
    id: number;
    username: string;
    role: string;
    phone: string;
    address: string;
  };
} 