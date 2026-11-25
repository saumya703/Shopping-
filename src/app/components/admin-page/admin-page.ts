import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderStatus } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

type AdminSection = 'overview' | 'products' | 'categories' | 'customers' | 'orders';
const ORDER_STATUSES: OrderStatus[] = ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

@Component({
  selector: 'app-admin-page',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly orderService = inject(OrderService);
  protected readonly auth = inject(AuthService);

  protected readonly section = signal<AdminSection>('overview');
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly products = computed(() => this.productService.products);
  protected readonly categories = computed(() => this.productService.categories);
  protected readonly orders = this.orderService.orders;
  protected readonly customers = computed(() =>
    this.auth.users().filter((user) => user.role === 'customer'),
  );
  protected readonly demoRevenue = computed(() =>
    this.orders()
      .filter((order) => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.total, 0),
  );
  protected readonly orderStatuses = ORDER_STATUSES;
  protected readonly editingProductId = signal<string | null>(null);

  protected readonly productForm = this.formBuilder.nonNullable.group({
    id: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['Rings', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['', Validators.required],
    description: ['', Validators.required],
    material: ['', Validators.required],
    availableQuantity: [0, [Validators.required, Validators.min(0)]],
    featured: [false],
  });
  protected readonly categoryForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
  });

  protected selectSection(section: AdminSection): void {
    this.section.set(section);
    this.clearMessages();
  }

  protected editProduct(product: Product): void {
    this.editingProductId.set(product.id);
    this.productForm.reset({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
      description: product.description,
      material: product.material,
      availableQuantity: product.availableQuantity,
      featured: product.featured ?? false,
    });
    this.selectSection('products');
  }

  protected saveProduct(): void {
    this.clearMessages();
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.error.set('Complete all required product fields with valid price and stock values.');
      return;
    }

    const value = this.productForm.getRawValue();
    const id = value.id
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!id) {
      this.error.set('Enter a product ID containing letters or numbers.');
      return;
    }
    if (this.editingProductId() !== id && this.productService.getById(id)) {
      this.error.set('That product ID already exists. Choose a unique ID.');
      return;
    }

    try {
      const editingId = this.editingProductId();
      const existingProduct = editingId ? this.productService.getById(editingId) : undefined;
      const product: Product = {
        ...(existingProduct ?? {}),
        ...value,
        id,
        featured: value.featured,
      };
      if (existingProduct?.galleryImages?.length) {
        product.galleryImages = [
          { ...existingProduct.galleryImages[0], src: value.imageUrl, alt: value.name },
          ...existingProduct.galleryImages.slice(1),
        ];
      }
      this.productService.saveProduct(product);
      this.message.set('Product saved to this browser demo.');
      this.resetProductForm();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to save product.');
    }
  }

  protected removeProduct(productId: string): void {
    this.clearMessages();
    this.productService.removeProduct(productId);
    this.cart.remove(productId);
    this.wishlist.remove(productId);
    this.message.set('Product removed from the local demo catalogue.');
    if (this.editingProductId() === productId) {
      this.resetProductForm();
    }
  }

  protected addCategory(): void {
    this.clearMessages();
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    try {
      this.productService.addCategory(this.categoryForm.controls.name.value);
      this.categoryForm.reset({ name: '' });
      this.message.set('Category added.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to add category.');
    }
  }

  protected removeCategory(category: string): void {
    this.clearMessages();
    try {
      this.productService.removeCategory(category);
      this.message.set(`${category} category removed.`);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to remove category.');
    }
  }

  protected updateOrderStatus(orderId: string, event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const status = event.target.value;
    if (!isOrderStatus(status)) {
      return;
    }
    this.clearMessages();
    try {
      this.orderService.updateStatus(orderId, status);
      this.message.set(`Order ${orderId} status updated.`);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to update order status.');
    }
  }

  protected resetProductForm(): void {
    this.editingProductId.set(null);
    this.productForm.reset({
      id: '',
      name: '',
      category: this.categories()[0] ?? 'Rings',
      price: 0,
      imageUrl: '',
      description: '',
      material: '',
      availableQuantity: 0,
      featured: false,
    });
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private clearMessages(): void {
    this.message.set('');
    this.error.set('');
  }
}
