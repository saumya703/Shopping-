import { Injectable, signal } from '@angular/core';
import {
  PRODUCT_CATEGORIES,
  Product,
  ProductImage,
  ProductOption,
  ProductSelection,
  ProductVideo,
} from '../models/product.model';

const PRODUCTS_STORAGE_KEY = 'diya-demo-products';
const CATEGORIES_STORAGE_KEY = 'diya-demo-categories';
const US_RING_SIZES = Array.from({ length: 17 }, (_, index) => {
  const size = 4 + index * 0.5;
  return { value: Number.isInteger(size) ? String(size) : size.toFixed(1) };
});

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly defaultProducts: Product[] = [
    {
      id: 'solstice-ring',
      name: 'Solstice Diamond Ring',
      category: 'Rings',
      price: 1280,
      imageUrl:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
      description:
        'A luminous round-cut stone rests in a refined setting, made to catch the light from every angle.',
      material: '18k recycled yellow gold · Lab-grown diamond',
      availableQuantity: 4,
      featured: true,
    },
    {
      id: 'heirloom-band',
      name: 'Heirloom Gold Band',
      category: 'Rings',
      price: 690,
      imageUrl:
        'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=900&q=85',
      description: 'A softly sculpted, polished band with a timeless silhouette for everyday wear.',
      material: '14k solid yellow gold',
      availableQuantity: 8,
    },
    {
      id: 'luna-pendant',
      name: 'Luna Pendant Necklace',
      category: 'Necklaces',
      price: 840,
      imageUrl:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
      description:
        'A delicate pendant suspended from a fine chain, inspired by the quiet glow of moonlight.',
      material: '18k recycled yellow gold · White sapphire',
      availableQuantity: 6,
      featured: true,
    },
    {
      id: 'celeste-chain',
      name: 'Celeste Layering Chain',
      category: 'Necklaces',
      price: 560,
      imageUrl:
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
      description: 'An effortlessly fine chain that brings a soft golden glow to every neckline.',
      material: '14k solid yellow gold',
      availableQuantity: 9,
    },
    {
      id: 'pearl-drop',
      name: 'Pearl Drop Earrings',
      category: 'Earrings',
      price: 720,
      imageUrl:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
      description:
        'Modern, graceful drops pair luminous freshwater pearls with a clean golden line.',
      material: '14k yellow gold · Freshwater pearls',
      availableQuantity: 5,
      featured: true,
    },
    {
      id: 'mini-hoops',
      name: 'Everyday Gold Hoops',
      category: 'Earrings',
      price: 460,
      imageUrl:
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
      description:
        'The perfect small hoop: lightweight, softly rounded, and easy to wear from day to night.',
      material: '14k solid yellow gold',
      availableQuantity: 3,
    },
    {
      id: 'sol-chain-bracelet',
      name: 'Sol Chain Bracelet',
      category: 'Bracelets',
      price: 520,
      imageUrl:
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
      description:
        'A fine, fluid chain finished with a subtle signature charm and an adjustable clasp.',
      material: '14k recycled yellow gold',
      availableQuantity: 7,
    },
    {
      id: 'elara-cuff',
      name: 'Elara Sculpted Cuff',
      category: 'Bracelets',
      price: 980,
      imageUrl:
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
      description: 'A softly sculpted cuff that makes a quiet statement, worn alone or stacked.',
      material: '18k gold vermeil on recycled silver',
      availableQuantity: 2,
      featured: true,
    },
  ];

  private readonly productItems = signal<Product[]>(this.restoreProducts());
  private readonly categoryItems = signal<string[]>(this.restoreCategories());

  get products(): Product[] {
    return this.productItems();
  }

  get categories(): string[] {
    return this.categoryItems();
  }

  getById(id: string): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  isValidSelection(product: Product, selection: ProductSelection): boolean {
    const options = product.customizationOptions ?? [];
    const supportedOptionIds = new Set(options.map((option) => option.id));
    if (Object.keys(selection).some((optionId) => !supportedOptionIds.has(optionId))) {
      return false;
    }

    return options.every((option) => {
      const selectedValue = selection[option.id];
      if (selectedValue === undefined) {
        return option.required !== true;
      }
      return option.values.some((value) => value.value === selectedValue);
    });
  }

  priceFor(product: Product, selection: ProductSelection = {}): number {
    if (!this.isValidSelection(product, selection)) {
      throw new Error(`The selected options are not available for "${product.name}".`);
    }

    return (
      product.price +
      (product.customizationOptions ?? []).reduce((total, option) => {
        const selectedValue = selection[option.id];
        const adjustment = option.values.find(
          (value) => value.value === selectedValue,
        )?.priceAdjustment;
        return total + (adjustment ?? 0);
      }, 0)
    );
  }

  saveProduct(product: Product): void {
    this.validateProduct(product);
    const category =
      this.categoryItems().find(
        (item) => item.toLocaleLowerCase() === product.category.trim().toLocaleLowerCase(),
      ) ?? product.category.trim();
    const normalizedProduct = this.withDefaultRingSize({ ...product, category });
    const existing = this.productItems().some((item) => item.id === product.id);
    const next = existing
      ? this.productItems().map((item) => (item.id === product.id ? normalizedProduct : item))
      : [...this.productItems(), normalizedProduct];
    this.persist(PRODUCTS_STORAGE_KEY, next);
    this.productItems.set(next);
    if (!this.categoryItems().some((item) => item === category)) {
      this.addCategory(category);
    }
  }

  removeProduct(productId: string): void {
    const next = this.productItems().filter((product) => product.id !== productId);
    this.productItems.set(next);
    this.persist(PRODUCTS_STORAGE_KEY, next);
  }

  addCategory(category: string): void {
    const normalized = category.trim();
    if (!normalized) {
      throw new Error('Enter a category name.');
    }
    if (
      this.categoryItems().some(
        (item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
      )
    ) {
      throw new Error('That category already exists.');
    }
    const next = [...this.categoryItems(), normalized];
    this.persist(CATEGORIES_STORAGE_KEY, next);
    this.categoryItems.set(next);
  }

  removeCategory(category: string): void {
    if (
      this.productItems().some(
        (product) => product.category.toLocaleLowerCase() === category.toLocaleLowerCase(),
      )
    ) {
      throw new Error('Move or remove products in this category before deleting it.');
    }
    const next = this.categoryItems().filter((item) => item !== category);
    this.categoryItems.set(next);
    this.persist(CATEGORIES_STORAGE_KEY, next);
  }

  getRelatedProducts(productId: string, limit = 3): Product[] {
    const product = this.getById(productId);
    if (!product) {
      return [];
    }

    return this.products
      .filter((candidate) => candidate.id !== productId)
      .sort(
        (first, second) =>
          Number(second.category === product.category) -
          Number(first.category === product.category),
      )
      .slice(0, limit);
  }

  private validateProduct(product: Product): void {
    if (
      !product.id.trim() ||
      !product.name.trim() ||
      !product.category.trim() ||
      !product.description.trim() ||
      !product.material.trim() ||
      !product.imageUrl.trim() ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      !Number.isSafeInteger(product.availableQuantity) ||
      product.availableQuantity < 0 ||
      !this.hasValidOptionalFields(product)
    ) {
      throw new Error('Complete all product fields with valid price and stock values.');
    }
  }

  private restoreProducts(): Product[] {
    const stored = this.readStorage(PRODUCTS_STORAGE_KEY);
    if (!stored) {
      return this.defaultProducts.map((product) => this.withDefaultRingSize(product));
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        throw new TypeError('Saved demo products must be an array.');
      }
      const products = parsed.filter((value): value is Product => this.isProduct(value));
      if (products.length !== parsed.length) {
        console.error('Some invalid demo product records were ignored.');
      }
      return products.map((product) => this.withDefaultRingSize(product));
    } catch (error) {
      console.error('Unable to restore demo products.', error);
      return this.defaultProducts;
    }
  }

  private restoreCategories(): string[] {
    const stored = this.readStorage(CATEGORIES_STORAGE_KEY);
    if (!stored) {
      return [...PRODUCT_CATEGORIES];
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
        throw new TypeError('Saved demo categories must be a list of names.');
      }
      return parsed;
    } catch (error) {
      console.error('Unable to restore demo categories.', error);
      return [...PRODUCT_CATEGORIES];
    }
  }

  private isProduct(value: unknown): value is Product {
    const hasValidBaseFields =
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      value.id.trim().length > 0 &&
      'name' in value &&
      typeof value.name === 'string' &&
      value.name.trim().length > 0 &&
      'category' in value &&
      typeof value.category === 'string' &&
      value.category.trim().length > 0 &&
      'price' in value &&
      typeof value.price === 'number' &&
      Number.isFinite(value.price) &&
      value.price >= 0 &&
      'imageUrl' in value &&
      typeof value.imageUrl === 'string' &&
      'description' in value &&
      typeof value.description === 'string' &&
      'material' in value &&
      typeof value.material === 'string' &&
      'availableQuantity' in value &&
      typeof value.availableQuantity === 'number' &&
      Number.isSafeInteger(value.availableQuantity) &&
      value.availableQuantity >= 0;

    return hasValidBaseFields && this.hasValidOptionalFields(value);
  }

  private hasValidOptionalFields(value: object): boolean {
    return (
      (!('sku' in value) || typeof value.sku === 'string') &&
      (!('galleryImages' in value) ||
        (Array.isArray(value.galleryImages) &&
          value.galleryImages.every((image: unknown) => this.isProductImage(image)))) &&
      (!('video' in value) || this.isProductVideo(value.video)) &&
      (!('originalPrice' in value) ||
        (typeof value.originalPrice === 'number' &&
          Number.isFinite(value.originalPrice) &&
          value.originalPrice >= 0)) &&
      (!('rating' in value) ||
        (typeof value.rating === 'number' &&
          Number.isFinite(value.rating) &&
          value.rating >= 0 &&
          value.rating <= 5)) &&
      (!('reviewCount' in value) ||
        (typeof value.reviewCount === 'number' &&
          Number.isSafeInteger(value.reviewCount) &&
          value.reviewCount >= 0)) &&
      (!('customizationOptions' in value) ||
        (Array.isArray(value.customizationOptions) &&
          value.customizationOptions.every((option: unknown) => this.isProductOption(option)))) &&
      (!('specifications' in value) || this.isStringRecord(value.specifications)) &&
      (!('detailContent' in value) || this.isStringRecord(value.detailContent))
    );
  }

  private withDefaultRingSize(product: Product): Product {
    if (product.category.trim().toLocaleLowerCase() !== 'rings') {
      return product;
    }

    const options = product.customizationOptions ?? [];
    if (options.some((option) => option.id === 'ring-size' || /\bsize\b/i.test(option.label))) {
      return product;
    }

    return {
      ...product,
      customizationOptions: [
        ...options,
        {
          id: 'ring-size',
          label: 'Ring size (US)',
          required: true,
          values: US_RING_SIZES,
        },
      ],
    };
  }

  private isProductImage(value: unknown): value is ProductImage {
    return (
      typeof value === 'object' &&
      value !== null &&
      'src' in value &&
      typeof value.src === 'string' &&
      'alt' in value &&
      typeof value.alt === 'string' &&
      (!('view' in value) || typeof value.view === 'string')
    );
  }

  private isProductVideo(value: unknown): value is ProductVideo {
    return (
      typeof value === 'object' &&
      value !== null &&
      'src' in value &&
      typeof value.src === 'string' &&
      'mimeType' in value &&
      value.mimeType === 'video/mp4' &&
      'title' in value &&
      typeof value.title === 'string' &&
      (!('posterUrl' in value) || typeof value.posterUrl === 'string') &&
      (!('is360' in value) || typeof value.is360 === 'boolean')
    );
  }

  private isProductOption(value: unknown): value is ProductOption {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      'label' in value &&
      typeof value.label === 'string' &&
      'values' in value &&
      Array.isArray(value.values) &&
      value.values.length > 0 &&
      value.values.every(
        (optionValue: unknown) =>
          typeof optionValue === 'object' &&
          optionValue !== null &&
          'value' in optionValue &&
          typeof optionValue.value === 'string' &&
          (!('priceAdjustment' in optionValue) ||
            (typeof optionValue.priceAdjustment === 'number' &&
              Number.isFinite(optionValue.priceAdjustment))),
      ) &&
      (!('required' in value) || typeof value.required === 'boolean')
    );
  }

  private isStringRecord(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      Object.values(value).every((item) => typeof item === 'string')
    );
  }

  private readStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Unable to read ${key} from localStorage.`, error);
      return null;
    }
  }

  private persist(key: string, value: unknown): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Unable to save ${key} to localStorage.`, error);
      throw new Error(
        'Unable to save catalogue changes in this browser. Check available storage and try again.',
      );
    }
  }
}
