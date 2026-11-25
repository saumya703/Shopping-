import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { WishlistPageComponent } from './wishlist-page';

describe('WishlistPageComponent', () => {
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
      imports: [WishlistPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('moves a saved product without required options to the cart', () => {
    const wishlist = TestBed.inject(WishlistService);
    const cart = TestBed.inject(CartService);
    wishlist.toggle('luna-pendant');

    const fixture = TestBed.createComponent(WishlistPageComponent);
    fixture.detectChanges();

    const moveButton = fixture.nativeElement.querySelector(
      '.add-to-cart-button',
    ) as HTMLButtonElement;
    expect(moveButton.textContent).toContain('Move to cart');

    moveButton.click();
    fixture.detectChanges();

    expect(cart.itemCount()).toBe(1);
    expect(wishlist.count()).toBe(0);
    expect(fixture.nativeElement.querySelector('.empty-wishlist')).not.toBeNull();
  });

  it('takes saved rings to product details to choose a size before adding', () => {
    const wishlist = TestBed.inject(WishlistService);
    wishlist.toggle('solstice-ring');

    const fixture = TestBed.createComponent(WishlistPageComponent);
    fixture.detectChanges();

    const chooseSizeLink = fixture.nativeElement.querySelector(
      '.choose-options-link',
    ) as HTMLAnchorElement;
    expect(chooseSizeLink.textContent).toContain('Choose ring size');
    expect(chooseSizeLink.getAttribute('href')).toBe('/products/solstice-ring');
  });
});
