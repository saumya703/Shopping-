import { computed, Injectable, signal } from '@angular/core';
import { CartLineItem } from '../models/product.model';
import { CustomerInformation, DemoOrder, OrderStatus } from '../models/order.model';

const ORDER_STORAGE_KEY = 'diya-demo-orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly orderItems = signal<DemoOrder[]>(this.restoreOrders());

  readonly orders = this.orderItems.asReadonly();
  readonly latestOrder = computed(() => this.orderItems()[0] ?? null);

  createDemoOrder(
    customer: CustomerInformation,
    items: CartLineItem[],
    subtotal: number,
    shipping: number,
    total: number,
    userId?: string,
  ): DemoOrder {
    if (items.length === 0) {
      throw new RangeError('Cannot create an order without cart items.');
    }

    const createdAt = new Date().toISOString();
    const order: DemoOrder = {
      id: `DIYA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      userId,
      customer: { ...customer },
      items: items.map((item) => ({ ...item, product: { ...item.product } })),
      subtotal,
      shipping,
      total,
      createdAt,
      status: 'Processing',
      trackingNumber: `TRK-${Date.now().toString(36).toUpperCase()}`,
      statusHistory: [
        {
          status: 'Processing',
          updatedAt: createdAt,
          description: 'Your demo order has been received.',
        },
      ],
    };

    this.setOrders([order, ...this.orderItems()]);
    return order;
  }

  getById(orderId: string): DemoOrder | undefined {
    return this.orderItems().find((order) => order.id === orderId);
  }

  getForCustomer(userId: string, email: string): DemoOrder[] {
    const normalizedEmail = email.trim().toLocaleLowerCase();
    return this.orderItems().filter(
      (order) =>
        order.userId === userId ||
        (!order.userId && order.customer.email.toLocaleLowerCase() === normalizedEmail),
    );
  }

  cancelOrder(orderId: string): void {
    const order = this.getById(orderId);
    if (!order) {
      throw new Error(`Order "${orderId}" was not found.`);
    }
    if (order.status !== 'Processing' && order.status !== 'Packed') {
      throw new Error('Only orders being prepared can be cancelled in this demo.');
    }
    this.setStatus(orderId, 'Cancelled', 'This demo order was cancelled.');
  }

  updateStatus(orderId: string, status: OrderStatus): void {
    if (!this.getById(orderId)) {
      throw new Error(`Order "${orderId}" was not found.`);
    }
    const descriptions: Record<OrderStatus, string> = {
      Processing: 'Your order is being prepared.',
      Packed: 'Your order has been packed for dispatch.',
      Shipped: 'Your order is on its way.',
      Delivered: 'Your order has been delivered.',
      Cancelled: 'This demo order was cancelled.',
    };
    this.setStatus(orderId, status, descriptions[status]);
  }

  private setStatus(orderId: string, status: OrderStatus, description: string): void {
    const updatedAt = new Date().toISOString();
    const updated = this.orderItems().map((order) =>
      order.id === orderId
        ? {
            ...order,
            status,
            statusHistory: [...order.statusHistory, { status, updatedAt, description }],
          }
        : order,
    );
    this.setOrders(updated);
  }

  private setOrders(orders: DemoOrder[]): void {
    this.orderItems.set(orders);
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Unable to save demo orders to localStorage.', error);
    }
  }

  private restoreOrders(): DemoOrder[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      if (!saved) {
        return [];
      }
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new TypeError('Saved demo orders must be an array.');
      }
      return parsed.filter((order): order is DemoOrder => this.isDemoOrder(order));
    } catch (error) {
      console.error('Unable to restore demo orders.', error);
      return [];
    }
  }

  private isDemoOrder(value: unknown): value is DemoOrder {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      'customer' in value &&
      typeof value.customer === 'object' &&
      value.customer !== null &&
      'email' in value.customer &&
      typeof value.customer.email === 'string' &&
      'items' in value &&
      Array.isArray(value.items) &&
      value.items.every((item) => this.isCartLine(item)) &&
      'createdAt' in value &&
      typeof value.createdAt === 'string' &&
      'subtotal' in value &&
      typeof value.subtotal === 'number' &&
      'shipping' in value &&
      typeof value.shipping === 'number' &&
      'total' in value &&
      typeof value.total === 'number' &&
      'trackingNumber' in value &&
      typeof value.trackingNumber === 'string' &&
      'statusHistory' in value &&
      Array.isArray(value.statusHistory) &&
      value.statusHistory.every((event) => this.isStatusEvent(event)) &&
      'status' in value &&
      ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(String(value.status))
    );
  }

  private isCartLine(value: unknown): value is CartLineItem {
    return (
      typeof value === 'object' &&
      value !== null &&
      'productId' in value &&
      typeof value.productId === 'string' &&
      'quantity' in value &&
      typeof value.quantity === 'number' &&
      'lineTotal' in value &&
      typeof value.lineTotal === 'number' &&
      'product' in value &&
      typeof value.product === 'object' &&
      value.product !== null &&
      'id' in value.product &&
      typeof value.product.id === 'string' &&
      'name' in value.product &&
      typeof value.product.name === 'string'
    );
  }

  private isStatusEvent(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      'status' in value &&
      ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(String(value.status)) &&
      'updatedAt' in value &&
      typeof value.updatedAt === 'string' &&
      'description' in value &&
      typeof value.description === 'string'
    );
  }
}
