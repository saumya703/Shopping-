import { TestBed } from '@angular/core/testing';
import { NewsletterSignupComponent } from './newsletter-signup';

describe('NewsletterSignupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterSignupComponent],
    }).compileComponents();
  });

  it('shows validation feedback for an empty or malformed email', () => {
    const fixture = TestBed.createComponent(NewsletterSignupComponent);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#newsletter-feedback').textContent).toContain(
      'Please enter your email address.',
    );

    const email = fixture.nativeElement.querySelector('#newsletter-email') as HTMLInputElement;
    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#newsletter-feedback').textContent).toContain(
      'Please enter a valid email address.',
    );
  });

  it('shows an honest demo confirmation for a valid email', () => {
    const fixture = TestBed.createComponent(NewsletterSignupComponent);
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('#newsletter-email') as HTMLInputElement;
    email.value = 'ava@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#newsletter-feedback').textContent).toContain(
      'does not send or store your email',
    );
    expect(email.value).toBe('');
  });
});
