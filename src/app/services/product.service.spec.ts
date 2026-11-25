import { TestBed } from '@angular/core/testing';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService demo administration', () => {
  let storedValues: Map<string, string>;
  let products: ProductService;

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
    products = TestBed.inject(ProductService);
  });

  it('persists catalogue edits and category updates', () => {
    const product: Product = {
      id: 'diya-test-pendant',
      name: 'Test Pendant',
      category: 'Gifts',
      price: 250,
      imageUrl: 'https://example.com/pendant.jpg',
      description: 'A test demo product.',
      material: 'Gold vermeil',
      availableQuantity: 2,
    };
    products.saveProduct(product);

    expect(products.getById(product.id)?.name).toBe('Test Pendant');
    expect(products.categories).toContain('Gifts');

    TestBed.resetTestingModule();
    products = TestBed.inject(ProductService);

    expect(products.getById(product.id)?.price).toBe(250);
    expect(products.categories).toContain('Gifts');
  });

  it('prevents removing categories still used by catalogue products', () => {
    expect(() => products.removeCategory('Rings')).toThrowError(/move or remove products/i);
  });

  it('validates product customizations and optional detail metadata', () => {
    const product = products.getById('mini-hoops');
    expect(product).toBeTruthy();
    const customizableProduct: Product = {
      ...product!,
      customizationOptions: [
        {
          id: 'metal',
          label: 'Metal',
          required: true,
          values: [{ value: '14K Yellow Gold' }, { value: '18K White Gold', priceAdjustment: 100 }],
        },
      ],
      galleryImages: [{ src: 'https://example.com/hoops-side.jpg', alt: 'Side view' }],
    };

    expect(products.isValidSelection(customizableProduct, {})).toBe(false);
    expect(products.isValidSelection(customizableProduct, { metal: '18K White Gold' })).toBe(true);
    expect(products.priceFor(customizableProduct, { metal: '18K White Gold' })).toBe(560);
    expect(() => products.saveProduct({ ...customizableProduct, rating: 6 })).toThrowError(
      /complete all product fields/i,
    );
  });

  it('provides US ring sizes for existing and newly added ring products', () => {
    const existingRing = products.getById('solstice-ring');
    expect(existingRing?.customizationOptions?.[0]).toMatchObject({
      id: 'ring-size',
      label: 'Ring size (US)',
      required: true,
    });
    expect(existingRing?.customizationOptions?.[0].values).toHaveLength(17);
    expect(existingRing?.customizationOptions?.[0].values.map((value) => value.value)).toContain(
      '7.5',
    );
    expect(products.isValidSelection(existingRing!, {})).toBe(false);

    const nonRing = products.getById('mini-hoops');
    products.saveProduct({
      ...nonRing!,
      id: 'new-test-ring',
      category: 'Rings',
      name: 'New Test Ring',
    });
    expect(products.getById('new-test-ring')?.customizationOptions?.[0].id).toBe('ring-size');
  });
});
