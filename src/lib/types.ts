export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[];
  category_id: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  is_hot: boolean;
  colors: string[];
  sizes: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
  tags: string[] | null;
  category: string | null;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  view_count: number | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[];
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
   shipper_id?: string | null;
   shipper_status?: string | null;
   delivery_address_lat?: number | null;
   delivery_address_lng?: number | null;
   estimated_delivery?: string | null;
   actual_delivery?: string | null;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  cartItemId: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
 
 export interface ShipperLocation {
   id: string;
   shipper_id: string;
   order_id: string | null;
   latitude: number;
   longitude: number;
   accuracy?: number | null;
   heading?: number | null;
   speed?: number | null;
   is_online: boolean;
   last_updated: string;
   created_at: string;
 }
 
 export interface OrderTracking {
   id: string;
   order_id: string;
   status: string;
   note?: string | null;
   location_lat?: number | null;
   location_lng?: number | null;
   created_by?: string | null;
   created_at: string;
 }
