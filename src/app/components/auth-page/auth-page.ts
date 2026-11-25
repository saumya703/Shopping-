import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly mode = this.route.snapshot.data['mode'] as AuthMode;
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    confirmPassword: [''],
  });

  ngOnInit(): void {
    const needsName = this.mode === 'signup';
    const needsPassword = this.mode === 'login' || this.mode === 'signup' || this.mode === 'reset';
    const needsConfirmation = this.mode === 'signup' || this.mode === 'reset';

    this.form.controls.fullName.setValidators(needsName ? [Validators.required, Validators.minLength(2)] : []);
    this.form.controls.password.setValidators(
      needsPassword ? [Validators.required, Validators.minLength(8)] : [],
    );
    this.form.controls.confirmPassword.setValidators(
      needsConfirmation ? [Validators.required, Validators.minLength(8)] : [],
    );
    this.form.controls.fullName.updateValueAndValidity();
    this.form.controls.email.updateValueAndValidity();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  protected submit(): void {
    this.error.set('');
    this.message.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (
      (this.mode === 'signup' || this.mode === 'reset') &&
      value.password !== value.confirmPassword
    ) {
      this.error.set('The passwords do not match.');
      return;
    }

    if (this.mode === 'forgot') {
      this.message.set('Demo reset instructions are ready. No email was sent.');
      return;
    }
    if (this.mode === 'reset') {
      this.message.set('Demo reset flow complete. No password was saved or changed.');
      return;
    }

    try {
      if (this.mode === 'signup') {
        this.auth.signup(value.fullName, value.email);
      } else {
        this.auth.login(value.email);
      }
      void this.router.navigateByUrl(this.returnUrl());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to start a demo session.');
    }
  }

  protected enterAdminDemo(): void {
    this.auth.enterAdminDemo();
    void this.router.navigate(['/admin']);
  }

  private returnUrl(): string {
    const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')
      ? requestedUrl
      : '/account';
  }
}
