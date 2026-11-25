import { TestBed } from '@angular/core/testing';
import { Product } from '../../models/product.model';
import { ProductReviewService } from '../../services/product-review.service';
import { ProductService } from '../../services/product.service';
import { ProductReviewsComponent } from './product-reviews';

describe('ProductReviewsComponent', () => {
  const reviewStorageKey = 'diya-demo-product-reviews';
  const product: Product = {
    id: 'test-product',
    name: 'Test Product',
    category: 'Rings',
    price: 500,
    imageUrl: 'https://images.example.com/product.jpg',
    description: 'A sample product used by this test.',
    material: '14k gold',
    availableQuantity: 3,
  };

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

    await TestBed.configureTestingModule({
      imports: [ProductReviewsComponent],
    }).compileComponents();
    TestBed.inject(ProductReviewService);
    // ProductReviewService only accepts reviews for catalogue items.
    const products = TestBed.inject(ProductService);
    products.saveProduct(product);
  });

  it('shows no fabricated ratings and saves a validated local review', () => {
    const fixture = TestBed.createComponent(ProductReviewsComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.no-rating').textContent).toContain('No ratings yet');
    expect(fixture.nativeElement.querySelectorAll('.review-card')).toHaveLength(0);

    const inputs = {
      displayName: 'Ava Stone',
      title: 'Beautiful quality',
      body: 'The details and finish are lovely.',
    };
    for (const [name, value] of Object.entries(inputs)) {
      const field = fixture.nativeElement.querySelector(
        `[formControlName="${name}"]`,
      ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const rating = fixture.nativeElement.querySelector(
      '[formControlName="rating"]',
    ) as HTMLSelectElement;
    rating.selectedIndex = 1;
    rating.dispatchEvent(new Event('change', { bubbles: true }));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.review-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.review-demo-note').textContent).toContain(
      'not published',
    );
    expect(TestBed.inject(ProductReviewService).averageRating(product.id)).toBe(5);
    expect(localStorage.getItem(reviewStorageKey)).toContain('Ava Stone');
  });
});
