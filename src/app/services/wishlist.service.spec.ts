import { TestBed } from '@angular/core/testing';
import { WishlistService } from './wishlist.service';

const WISHLIST_STORAGE_KEY = 'oro-jewellery-wishlist';

describe('WishlistService', () => {
  let wishlist: WishlistService;

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
    wishlist = TestBed.inject(WishlistService);
  });

  it('adds and removes products while keeping the count in sync', () => {
    wishlist.toggle('solstice-ring');
    expect(wishlist.contains('solstice-ring')).toBe(true);
    expect(wishlist.count()).toBe(1);

    wishlist.toggle('solstice-ring');
    expect(wishlist.contains('solstice-ring')).toBe(false);
    expect(wishlist.count()).toBe(0);
  });

  it('keeps different saved products independent', () => {
    wishlist.toggle('solstice-ring');
    wishlist.toggle('luna-pendant');

    expect(wishlist.count()).toBe(2);
    expect(wishlist.contains('solstice-ring')).toBe(true);
    expect(wishlist.contains('luna-pendant')).toBe(true);
  });

  it('removes products and persists wishlist changes across service recreation', () => {
    wishlist.toggle('solstice-ring');
    wishlist.toggle('luna-pendant');
    wishlist.remove('solstice-ring');

    TestBed.resetTestingModule();
    wishlist = TestBed.inject(WishlistService);

    expect(wishlist.count()).toBe(1);
    expect(wishlist.contains('solstice-ring')).toBe(false);
    expect(wishlist.contains('luna-pendant')).toBe(true);
  });

  it('ignores unknown product IDs restored from localStorage', () => {
    localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify(['solstice-ring', 'not-a-product']),
    );
    TestBed.resetTestingModule();
    wishlist = TestBed.inject(WishlistService);

    expect(wishlist.count()).toBe(1);
    expect(wishlist.contains('solstice-ring')).toBe(true);
    expect(wishlist.contains('not-a-product')).toBe(false);
  });
});
