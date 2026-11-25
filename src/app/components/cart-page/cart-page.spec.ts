import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { CartPageComponent } from './cart-page';

describe('CartPageComponent', () => {
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
      imports: [CartPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('links cart products to their detail page and moves products to the wishlist', () => {
    const cart = TestBed.inject(CartService);
    const wishlist = TestBed.inject(WishlistService);
    cart.add('mini-hoops');

    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
    const productLink = fixture.nativeElement.querySelector('.item-name') as HTMLAnchorElement;
    expect(productLink.getAttribute('href')).toBe('/products/mini-hoops');

    (fixture.nativeElement.querySelector('.move-to-wishlist-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cart.itemCount()).toBe(0);
    expect(wishlist.contains('mini-hoops')).toBe(true);
  });
});
