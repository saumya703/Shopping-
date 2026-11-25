import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { TrendingProductsComponent } from './trending-products';

describe('TrendingProductsComponent', () => {
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
      imports: [TrendingProductsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows four available products and adds a quick-view item to the bag', () => {
    const fixture = TestBed.createComponent(TrendingProductsComponent);
    const cart = TestBed.inject(CartService);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.trending-grid app-product-card')).toHaveLength(
      4,
    );
    (fixture.nativeElement.querySelectorAll('.quick-view-button')[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();

    (fixture.nativeElement.querySelector('.quick-view-add') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cart.itemCount()).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
});
