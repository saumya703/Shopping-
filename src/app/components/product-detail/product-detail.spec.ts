import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ProductDetailComponent } from './product-detail';

describe('ProductDetailComponent', () => {
  beforeEach(async () => {
    const storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => storedValues.set(key, value),
        removeItem: (key: string) => storedValues.delete(key),
      },
    });

    const paramMap = convertToParamMap({ id: 'mini-hoops' });
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(paramMap), snapshot: { paramMap } },
        },
      ],
    }).compileComponents();
  });

  it('limits quantity to available stock and adds the selected quantity to the cart', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const cart = TestBed.inject(CartService);
    fixture.detectChanges();

    const increaseButton = fixture.nativeElement.querySelector(
      '.product-copy [aria-label="Increase quantity"]',
    ) as HTMLButtonElement;
    increaseButton.click();
    fixture.detectChanges();
    increaseButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('3 available');
    expect(increaseButton.disabled).toBe(true);

    const addButton = fixture.nativeElement.querySelector(
      '.product-copy .add-to-bag-button',
    ) as HTMLButtonElement;
    addButton.click();

    expect(cart.itemCount()).toBe(3);
    expect(cart.lines()[0].productId).toBe('mini-hoops');
  });

  it('updates optional variation pricing and clears the variation when no preference is selected', () => {
    const products = TestBed.inject(ProductService);
    const product = products.getById('mini-hoops');
    expect(product).toBeTruthy();
    products.saveProduct({
      ...product!,
      customizationOptions: [
        {
          id: 'metal',
          label: 'Metal',
          values: [{ value: '14K Yellow Gold' }, { value: '18K White Gold', priceAdjustment: 100 }],
        },
      ],
    });

    const fixture = TestBed.createComponent(ProductDetailComponent);
    const cart = TestBed.inject(CartService);
    fixture.detectChanges();

    const metalSelect = fixture.nativeElement.querySelector(
      '#product-option-metal',
    ) as HTMLSelectElement;
    metalSelect.value = '18K White Gold';
    metalSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.product-pricing strong').textContent).toContain(
      '$560',
    );

    metalSelect.value = '';
    metalSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.product-pricing strong').textContent).toContain(
      '$460',
    );

    (fixture.nativeElement.querySelector('.add-to-bag-button') as HTMLButtonElement).click();
    expect(cart.lines()[0].selectedOptions).toEqual({});
    expect(cart.lines()[0].unitPrice).toBe(460);
  });

  it('requires a ring size before adding a ring to the bag', () => {
    const products = TestBed.inject(ProductService);
    const product = products.getById('mini-hoops');
    expect(product).toBeTruthy();
    products.saveProduct({ ...product!, category: 'Rings' });

    const fixture = TestBed.createComponent(ProductDetailComponent);
    const cart = TestBed.inject(CartService);
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector(
      '.add-to-bag-button',
    ) as HTMLButtonElement;
    const sizeSelect = fixture.nativeElement.querySelector(
      '#product-option-ring-size',
    ) as HTMLSelectElement;
    expect(sizeSelect).toBeTruthy();
    expect(sizeSelect.value).toBe('');
    expect(addButton.disabled).toBe(true);

    sizeSelect.value = '7.5';
    sizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(addButton.disabled).toBe(false);
    addButton.click();

    expect(cart.lines()[0].selectedOptions).toEqual({ 'ring-size': '7.5' });
  });
});
