import { TestBed } from '@angular/core/testing';
import { Product } from '../../models/product.model';
import { ProductGalleryComponent } from './product-gallery';

describe('ProductGalleryComponent', () => {
  const product: Product = {
    id: 'test-ring',
    name: 'Test Ring',
    category: 'Rings',
    price: 500,
    imageUrl: 'https://images.example.com/ring-main.jpg',
    description: 'A sample product used by this test.',
    material: '14k gold',
    availableQuantity: 2,
    galleryImages: [
      {
        src: 'https://images.example.com/ring-front.jpg',
        alt: 'Ring front view',
        view: 'Front view',
      },
      {
        src: 'https://images.example.com/ring-side.jpg',
        alt: 'Ring side view',
        view: 'Side view',
      },
    ],
    video: {
      src: 'https://media.example.com/ring-tour.mp4',
      mimeType: 'video/mp4',
      title: 'Ring demonstration',
      is360: true,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGalleryComponent],
    }).compileComponents();
  });

  it('switches product images, opens a zoomable lightbox, and closes it with Escape', () => {
    const fixture = TestBed.createComponent(ProductGalleryComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.gallery-thumbnail')).toHaveLength(3);
    (fixture.nativeElement.querySelectorAll('.gallery-thumbnail')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.main-image-trigger img').getAttribute('src')).toBe(
      'https://images.example.com/ring-side.jpg',
    );

    (fixture.nativeElement.querySelector('.main-image-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();

    (fixture.nativeElement.querySelector('[aria-label="Zoom in"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lightbox-controls').textContent).toContain('125%');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not expose a video without an MP4 asset URL', () => {
    const fixture = TestBed.createComponent(ProductGalleryComponent);
    fixture.componentRef.setInput('product', {
      ...product,
      video: { ...product.video!, src: 'https://media.example.com/ring-tour.mov' },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.gallery-thumbnail')).toHaveLength(2);
  });

  it('shows a clear fallback when the selected product image fails to load', () => {
    const fixture = TestBed.createComponent(ProductGalleryComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('.main-image-trigger img') as HTMLImageElement
    ).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.media-fallback').textContent).toContain(
      'Product image unavailable',
    );
  });
});
