export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string | null;
  is_available: boolean;
  details?: string[] | null;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Order {
  id: string;
  customer_name: string;
  table_number: string;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled';
  order_items: OrderItem[];
  created_at: string;
  payment_method?: string | null;
  receipt_url?: string | null;
  phone_number?: string | null;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface CarouselImage {
  id: string;
  url: string;
  label?: string;
  created_at?: string;
}

export interface CarouselSettings {
  id: number;
  enabled: boolean;
  speed: number;
}

export interface AdminLog {
  id: string;
  action: string;
  details: string | null;
  admin_email: string | null;
  created_at: string;
}
