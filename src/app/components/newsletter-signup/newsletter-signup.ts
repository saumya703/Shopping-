import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-newsletter-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-signup.html',
  styleUrl: './newsletter-signup.scss',
})
export class NewsletterSignupComponent {
  protected readonly submitted = signal(false);
  protected readonly signupMessage = signal('');
  protected readonly newsletterForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected submit(): void {
    this.submitted.set(true);
    this.signupMessage.set('');

    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }

    this.signupMessage.set(
      'Thank you for joining DIYA. This demo does not send or store your email yet.',
    );
    this.newsletterForm.reset();
    this.submitted.set(false);
  }
}
