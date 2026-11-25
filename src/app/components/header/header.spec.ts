import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { HeaderComponent } from './header';

describe('HeaderComponent category navigation', () => {
  it('keeps new categories in the More menu', async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    TestBed.inject(ProductService).addCategory('Anklets');
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();

    const moreMenu = fixture.nativeElement.querySelector('.nav-more') as HTMLElement | null;
    expect(moreMenu).not.toBeNull();
    expect(moreMenu?.textContent).toContain('Anklets');
    expect(fixture.nativeElement.querySelector('.main-nav > a')).toBeTruthy();
  });
});
