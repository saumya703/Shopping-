import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ProductListComponent } from './product-list';

describe('ProductListComponent', () => {
  let productService: ProductService;
  let originalAvailability: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    productService = TestBed.inject(ProductService);
    originalAvailability = productService.products[0].availableQuantity;
  });

  afterEach(() => {
    productService.products[0].availableQuantity = originalAvailability;
  });

  it('filters by search and price, then sorts by price', () => {
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();

    fixture.componentRef.setInput('searchTerm', 'gold');
    const priceSelect = fixture.nativeElement.querySelector(
      '.catalogue-options select',
    ) as HTMLSelectElement;
    priceSelect.value = '500';
    priceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    let names = [...fixture.nativeElement.querySelectorAll('.product-name')].map(
      (link: HTMLAnchorElement) => link.textContent?.trim(),
    );
    expect(names).toEqual(['Everyday Gold Hoops']);

    fixture.componentRef.setInput('searchTerm', '');
    priceSelect.value = '';
    priceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    const sortSelect = fixture.nativeElement.querySelectorAll(
      '.catalogue-options select',
    )[1] as HTMLSelectElement;
    sortSelect.value = 'price-desc';
    sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    names = [...fixture.nativeElement.querySelectorAll('.product-name')].map(
      (link: HTMLAnchorElement) => link.textContent?.trim(),
    );
    expect(names[0]).toBe('Solstice Diamond Ring');
  });

  it('filters out products with no remaining stock', () => {
    productService.products[0].availableQuantity = 0;
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();

    const stockFilter = fixture.nativeElement.querySelector(
      '.availability-filter input',
    ) as HTMLInputElement;
    stockFilter.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-product-card')).toHaveLength(7);
  });

  it('clearly labels a selected category', () => {
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.componentRef.setInput('selectedCategory', 'Rings');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#collection-title').textContent.trim()).toBe('Rings');
    expect(fixture.nativeElement.querySelector('.product-grid app-product-card')).toBeTruthy();
  });
});
