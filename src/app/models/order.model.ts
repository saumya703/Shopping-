import { CartLineItem } from './product.model';

export interface CustomerInformation {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export type OrderStatus = 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderStatusEvent {
  status: OrderStatus;
  updatedAt: string;
  description: string;
}

export interface DemoOrder {
  id: string;
  userId?: string;
  customer: CustomerInformation;
  items: CartLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  status: OrderStatus;
  trackingNumber: string;
  statusHistory: OrderStatusEvent[];
}
