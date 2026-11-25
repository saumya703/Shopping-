export const PRODUCT_CATEGORIES = ['Rings', 'Necklaces', 'Earrings', 'Bracelets'] as const;
export const SHOP_CATEGORY_NAMES = [
  'Rings',
  'Earrings',
  'Necklaces',
  'Pendants',
  'Bracelets',
  'Bangles',
  'Mangalsutra',
  'Wedding Jewellery',
  'Bridal Jewellery',
  "Men's Jewellery",
  'Diamond Jewellery',
  'Gold Jewellery',
] as const;

export type ProductCategory = string;
export type CategoryFilter = ProductCategory | 'All';

export interface ProductImage {
  src: string;
  alt: string;
  view?: string;
}

export interface ProductVideo {
  src: string;
  mimeType: 'video/mp4';
  title: string;
  posterUrl?: string;
  is360?: boolean;
}

export interface ProductOptionValue {
  value: string;
  priceAdjustment?: number;
}

export interface ProductOption {
  id: string;
  label: string;
  required?: boolean;
  values: ProductOptionValue[];
}

export type ProductSelection = Readonly<Record<string, string>>;

export interface ProductDetailContent {
  metalInformation?: string;
  diamondDetails?: string;
  returnsExchanges?: string;
  certification?: string;
  careInstructions?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  description: string;
  material: string;
  availableQuantity: number;
  featured?: boolean;
  sku?: string;
  galleryImages?: ProductImage[];
  video?: ProductVideo;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  customizationOptions?: ProductOption[];
  specifications?: Record<string, string>;
  detailContent?: ProductDetailContent;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface CartLineItem extends CartItem {
  product: Product;
  itemKey: string;
  unitPrice: number;
  lineTotal: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  displayName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  photoUrls?: string[];
}

export function isProductCategory(value: string | null): value is ProductCategory {
  return value !== null && PRODUCT_CATEGORIES.some((category) => category === value);
}
