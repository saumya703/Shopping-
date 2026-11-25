import { computed, inject, Injectable, signal } from '@angular/core';
import { CartItem, CartLineItem, ProductSelection } from '../models/product.model';
import { ToastService } from './toast.service';
import { ProductService } from './product.service';

const CART_STORAGE_KEY = 'oro-jewellery-cart';
const FREE_SHIPPING_THRESHOLD = 250;
const STANDARD_SHIPPING = 15;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly cartItems = signal<CartItem[]>(this.restoreItems());

  readonly items = this.cartItems.asReadonly();
  readonly lines = computed<CartLineItem[]>(() =>
    this.cartItems().flatMap((item) => {
      const product = this.productService.getById(item.productId);
      if (!product) {
        return [];
      }

      const selectedOptions = item.selectedOptions ?? {};
      const unitPrice = this.productService.priceFor(product, selectedOptions);
      return [
        {
          ...item,
          selectedOptions,
          product,
          itemKey: this.itemKey(item),
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        },
      ];
    }),
  );
  readonly itemCount = computed(() =>
    this.lines().reduce((count, item) => count + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.lines().reduce((total, item) => total + item.lineTotal, 0),
  );
  readonly shipping = computed(() =>
    this.subtotal() === 0 || this.subtotal() > FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING,
  );
  readonly total = computed(() => this.subtotal() + this.shipping());

  quantityFor(productId: string, selectedOptions?: ProductSelection): number {
    return this.cartItems()
      .filter(
        (item) =>
          item.productId === productId &&
          (selectedOptions === undefined ||
            this.hasSameOptions(item.selectedOptions ?? {}, selectedOptions)),
      )
      .reduce((total, item) => total + item.quantity, 0);
  }

  add(productId: string, quantity = 1, selection: ProductSelection = {}): void {
    this.validateQuantity(quantity);
    const product = this.productService.getById(productId);
    if (!product) {
      throw new Error(`Cannot add unknown product "${productId}" to the cart.`);
    }
    if (!this.productService.isValidSelection(product, selection)) {
      throw new Error(`The selected options are not available for "${product.name}".`);
    }

    const currentItems = this.cartItems();
    const selectedOptions = { ...selection };
    const existing = currentItems.find(
      (item) =>
        item.productId === productId &&
        this.hasSameOptions(item.selectedOptions ?? {}, selectedOptions),
    );
    const nextQuantity = this.quantityFor(productId) + quantity;
    this.validateQuantity(nextQuantity);
    if (nextQuantity > product.availableQuantity) {
      throw new RangeError(`Only ${product.availableQuantity} of "${product.name}" are available.`);
    }

    const nextItems = existing
      ? currentItems.map((item) =>
          item.productId === productId &&
          this.hasSameOptions(item.selectedOptions ?? {}, selectedOptions)
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...currentItems, { productId, quantity, selectedOptions }];

    this.setItems(nextItems);
    this.toast.showProductAdded(product.name);
  }

  increaseQuantity(productId: string, selectedOptions?: ProductSelection): void {
    const item = this.findItem(productId, selectedOptions);
    if (item) {
      this.setQuantity(productId, item.quantity + 1, item.selectedOptions ?? {});
    }
  }

  decreaseQuantity(productId: string, selectedOptions?: ProductSelection): void {
    const item = this.findItem(productId, selectedOptions);
    if (item && item.quantity > 1) {
      this.setQuantity(productId, item.quantity - 1, item.selectedOptions ?? {});
    }
  }

  remove(productId: string, selectedOptions?: ProductSelection): void {
    this.setItems(
      this.cartItems().filter(
        (item) =>
          item.productId !== productId ||
          (selectedOptions !== undefined &&
            !this.hasSameOptions(item.selectedOptions ?? {}, selectedOptions)),
      ),
    );
  }

  clear(): void {
    this.setItems([]);
  }

  private setQuantity(
    productId: string,
    quantity: number,
    selectedOptions: ProductSelection,
  ): void {
    this.validateQuantity(quantity);
    const product = this.productService.getById(productId);
    if (!product) {
      throw new Error(`Cannot update unknown product "${productId}" in the cart.`);
    }
    if (this.quantityFor(productId) - this.quantityFor(productId, selectedOptions) + quantity > product.availableQuantity) {
      throw new RangeError(`Only ${product.availableQuantity} of "${product.name}" are available.`);
    }

    this.setItems(
      this.cartItems().map((item) =>
        item.productId === productId &&
        this.hasSameOptions(item.selectedOptions ?? {}, selectedOptions)
          ? { ...item, quantity }
          : item,
      ),
    );
  }

  private findItem(
    productId: string,
    selectedOptions?: ProductSelection,
  ): CartItem | undefined {
    return this.cartItems().find(
      (item) =>
        item.productId === productId &&
        (selectedOptions === undefined ||
          this.hasSameOptions(item.selectedOptions ?? {}, selectedOptions)),
    );
  }

  private hasSameOptions(first: ProductSelection, second: ProductSelection): boolean {
    const firstKeys = Object.keys(first).sort();
    const secondKeys = Object.keys(second).sort();
    return (
      firstKeys.length === secondKeys.length &&
      firstKeys.every((key, index) => key === secondKeys[index] && first[key] === second[key])
    );
  }

  private itemKey(item: CartItem): string {
    const selection = Object.entries(item.selectedOptions ?? {})
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${item.productId}${selection ? `?${selection}` : ''}`;
  }

  private setItems(items: CartItem[]): void {
    this.cartItems.set(items);
    this.persistItems(items);
  }

  private validateQuantity(quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new RangeError('Cart quantity must be a positive safe integer.');
    }
  }

  private restoreItems(): CartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    let storedValue: string | null;
    try {
      storedValue = localStorage.getItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Unable to read the saved cart from localStorage.', error);
      return [];
    }

    if (!storedValue) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(storedValue);
      if (!Array.isArray(parsed)) {
        throw new TypeError('Saved cart data must be an array.');
      }

      const items = parsed.filter((value): value is CartItem => this.isValidItem(value));
      if (items.length !== parsed.length) {
        console.error('Some invalid or unavailable products were removed from the saved cart.');
      }
      return items;
    } catch (error) {
      console.error('Unable to parse the saved cart from localStorage.', error);
      return [];
    }
  }

  private isValidItem(value: unknown): value is CartItem {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('productId' in value) ||
      !('quantity' in value) ||
      typeof value.productId !== 'string' ||
      typeof value.quantity !== 'number'
    ) {
      return false;
    }

    const product = this.productService.getById(value.productId);
    const selectedOptions =
      'selectedOptions' in value
        ? this.asStringRecord(value.selectedOptions)
        : {};
    return (
      product !== undefined &&
      Number.isSafeInteger(value.quantity) &&
      value.quantity > 0 &&
      value.quantity <= product.availableQuantity &&
      selectedOptions !== null &&
      this.productService.isValidSelection(product, selectedOptions)
    );
  }

  private asStringRecord(value: unknown): Record<string, string> | null {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      return null;
    }
    const record: Record<string, string> = {};
    for (const [key, item] of Object.entries(value)) {
      if (typeof item !== 'string') {
        return null;
      }
      record[key] = item;
    }
    return record;
  }

  private persistItems(items: CartItem[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Unable to save the cart to localStorage.', error);
    }
  }
}
