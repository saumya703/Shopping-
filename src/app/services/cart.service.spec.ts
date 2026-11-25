import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { ProductService } from './product.service';

const CART_STORAGE_KEY = 'oro-jewellery-cart';

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    const storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => storedValues.set(key, value),
        removeItem: (key: string) => storedValues.delete(key),
      },
    });
    localStorage.removeItem(CART_STORAGE_KEY);
    cart = TestBed.inject(CartService);
  });

  it('adds products, combines quantities, and calculates totals', () => {
    cart.add('mini-hoops', 2);
    cart.add('mini-hoops');

    expect(cart.itemCount()).toBe(3);
    expect(cart.subtotal()).toBe(1380);
    expect(cart.shipping()).toBe(0);
    expect(cart.total()).toBe(1380);
    expect(cart.lines()[0].quantity).toBe(3);
  });

  it('prevents quantities below one and supports removal and clearing', () => {
    cart.add('mini-hoops');
    cart.decreaseQuantity('mini-hoops');
    expect(cart.lines()[0].quantity).toBe(1);
    expect(() => cart.add('mini-hoops', 0)).toThrowError(RangeError);

    cart.increaseQuantity('mini-hoops');
    expect(cart.lines()[0].quantity).toBe(2);
    cart.remove('mini-hoops');
    expect(cart.itemCount()).toBe(0);

    cart.add('luna-pendant');
    cart.clear();
    expect(cart.items()).toEqual([]);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe('[]');
  });

  it('prevents adding more than the available stock', () => {
    cart.add('mini-hoops', 3);

    expect(() => cart.add('mini-hoops')).toThrowError(RangeError);
    expect(() => cart.increaseQuantity('mini-hoops')).toThrowError(RangeError);
    expect(cart.itemCount()).toBe(3);
  });

  it('restores saved cart items from localStorage', () => {
    cart.add('pearl-drop', 2);
    TestBed.resetTestingModule();
    cart = TestBed.inject(CartService);

    expect(cart.itemCount()).toBe(2);
    expect(cart.subtotal()).toBe(1440);
  });

  it('keeps supported product selections distinct and prices them in the cart', () => {
    const products = TestBed.inject(ProductService);
    const baseProduct = products.getById('mini-hoops');
    expect(baseProduct).toBeTruthy();
    products.saveProduct({
      ...baseProduct!,
      customizationOptions: [
        {
          id: 'metal',
          label: 'Metal',
          required: true,
          values: [{ value: '14K Yellow Gold' }, { value: '18K White Gold', priceAdjustment: 100 }],
        },
      ],
    });

    cart.add('mini-hoops', 1, { metal: '14K Yellow Gold' });
    cart.add('mini-hoops', 1, { metal: '18K White Gold' });

    expect(cart.quantityFor('mini-hoops')).toBe(2);
    expect(cart.quantityFor('mini-hoops', { metal: '14K Yellow Gold' })).toBe(1);
    expect(cart.lines()).toHaveLength(2);
    expect(
      cart
        .lines()
        .map((line) => line.unitPrice)
        .sort((a, b) => a - b),
    ).toEqual([460, 560]);
    expect(() => cart.add('mini-hoops')).toThrowError('selected options');
  });

  it('persists the selected ring size as part of the cart line', () => {
    cart.add('solstice-ring', 1, { 'ring-size': '7.5' });
    expect(cart.lines()[0].selectedOptions).toEqual({ 'ring-size': '7.5' });
    expect(cart.lines()[0].itemKey).toContain('ring-size=7.5');

    TestBed.resetTestingModule();
    cart = TestBed.inject(CartService);

    expect(cart.lines()[0].selectedOptions).toEqual({ 'ring-size': '7.5' });
  });
});
