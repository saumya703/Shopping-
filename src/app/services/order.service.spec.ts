import { TestBed } from '@angular/core/testing';
import { CustomerInformation } from '../models/order.model';
import { CartLineItem } from '../models/product.model';
import { ProductService } from './product.service';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let storedValues: Map<string, string>;
  let orders: OrderService;

  beforeEach(() => {
    storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => storedValues.set(key, value),
        removeItem: (key: string) => storedValues.delete(key),
      },
    });
    TestBed.resetTestingModule();
    orders = TestBed.inject(OrderService);
  });

  it('persists uniquely identified orders and tracks a demo cancellation', () => {
    const product = TestBed.inject(ProductService).getById('mini-hoops');
    if (!product) {
      throw new Error('Test product is missing.');
    }
    const item: CartLineItem = {
      productId: product.id,
      quantity: 1,
      product,
      itemKey: product.id,
      unitPrice: product.price,
      lineTotal: product.price,
    };
    const customer: CustomerInformation = {
      fullName: 'Ava Stone',
      email: 'ava@example.com',
      phone: '+14155550123',
      address: '42 Garden Avenue',
      city: 'Denver',
      state: 'Colorado',
      postalCode: '80202',
    };

    const order = orders.createDemoOrder(customer, [item], 460, 0, 460, 'customer-1');
    expect(order.id.startsWith('DIYA-')).toBe(true);
    expect(order.status).toBe('Processing');
    expect(orders.getForCustomer('customer-1', customer.email)).toHaveLength(1);

    orders.cancelOrder(order.id);

    expect(orders.getById(order.id)?.status).toBe('Cancelled');
    expect(orders.getById(order.id)?.statusHistory).toHaveLength(2);
    expect(storedValues.get('diya-demo-orders')).toContain(order.id);
  });

  it('rejects cancellation after dispatch', () => {
    const product = TestBed.inject(ProductService).getById('mini-hoops');
    if (!product) {
      throw new Error('Test product is missing.');
    }
    const item: CartLineItem = {
      productId: product.id,
      quantity: 1,
      product,
      itemKey: product.id,
      unitPrice: product.price,
      lineTotal: product.price,
    };
    const customer: CustomerInformation = {
      fullName: 'Ava Stone',
      email: 'ava@example.com',
      phone: '+14155550123',
      address: '42 Garden Avenue',
      city: 'Denver',
      state: 'Colorado',
      postalCode: '80202',
    };
    const order = orders.createDemoOrder(customer, [item], 460, 0, 460);
    orders.updateStatus(order.id, 'Shipped');

    expect(() => orders.cancelOrder(order.id)).toThrowError(/only orders being prepared/i);
  });
});
