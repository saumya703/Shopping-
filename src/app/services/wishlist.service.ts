import { computed, inject, Injectable, signal } from '@angular/core';
import { ProductService } from './product.service';

const WISHLIST_STORAGE_KEY = 'oro-jewellery-wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly productService = inject(ProductService);
  private readonly savedIds = signal<ReadonlySet<string>>(this.restoreIds());

  readonly count = computed(() =>
    [...this.savedIds()].filter((productId) => this.productService.getById(productId) !== undefined)
      .length,
  );
  readonly ids = this.savedIds.asReadonly();

  contains(productId: string): boolean {
    return this.savedIds().has(productId);
  }

  toggle(productId: string): void {
    if (!this.productService.getById(productId)) {
      throw new Error(`Cannot save unknown product "${productId}" to the wishlist.`);
    }

    const nextIds = new Set(this.savedIds());
    if (nextIds.has(productId)) {
      nextIds.delete(productId);
    } else {
      nextIds.add(productId);
    }
    this.setIds(nextIds);
  }

  remove(productId: string): void {
    const nextIds = new Set(this.savedIds());
    nextIds.delete(productId);
    this.setIds(nextIds);
  }

  private setIds(ids: Set<string>): void {
    this.savedIds.set(ids);
    this.persistIds(ids);
  }

  private restoreIds(): ReadonlySet<string> {
    if (typeof localStorage === 'undefined') {
      return new Set();
    }

    let storedValue: string | null;
    try {
      storedValue = localStorage.getItem(WISHLIST_STORAGE_KEY);
    } catch (error) {
      console.error('Unable to read the saved wishlist from localStorage.', error);
      return new Set();
    }

    if (!storedValue) {
      return new Set();
    }

    try {
      const parsed: unknown = JSON.parse(storedValue);
      if (!Array.isArray(parsed)) {
        throw new TypeError('Saved wishlist data must be an array.');
      }

      const validIds = parsed.filter(
        (id): id is string => typeof id === 'string' && this.productService.getById(id) !== undefined,
      );
      if (validIds.length !== parsed.length) {
        console.error('Some invalid or unavailable products were removed from the saved wishlist.');
      }
      return new Set(validIds);
    } catch (error) {
      console.error('Unable to parse the saved wishlist from localStorage.', error);
      return new Set();
    }
  }

  private persistIds(ids: ReadonlySet<string>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([...ids]));
    } catch (error) {
      console.error('Unable to save the wishlist to localStorage.', error);
    }
  }
}
