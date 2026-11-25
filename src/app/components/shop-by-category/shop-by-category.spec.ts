import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShopByCategoryComponent } from './shop-by-category';

describe('ShopByCategoryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopByCategoryComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows twelve categories with distinct images and catalogue links', () => {
    const fixture = TestBed.createComponent(ShopByCategoryComponent);
    fixture.detectChanges();

    const links = [
      ...fixture.nativeElement.querySelectorAll('.category-card'),
    ] as HTMLAnchorElement[];
    const imageUrls = links.map((link) =>
      (link.querySelector('img') as HTMLImageElement).getAttribute('src'),
    );

    expect(links).toHaveLength(12);
    expect(new Set(imageUrls).size).toBe(12);
    expect(links[0].getAttribute('href')).toContain('category=Rings');
    expect(links.every((link) => link.getAttribute('href')?.startsWith('/?'))).toBe(true);
  });
});
