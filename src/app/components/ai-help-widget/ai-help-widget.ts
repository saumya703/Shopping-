import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssistantTurn } from '../../models/assistant.model';
import { Product } from '../../models/product.model';
import { AiAssistantService } from '../../services/ai-assistant.service';

interface HelpMessage extends AssistantTurn {
  id: number;
  products?: Product[];
}

@Component({
  selector: 'app-ai-help-widget',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './ai-help-widget.html',
  styleUrl: './ai-help-widget.scss',
})
export class AiHelpWidgetComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly assistant = inject(AiAssistantService);
  protected readonly isOpen = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly form = this.formBuilder.nonNullable.group({
    question: ['', Validators.required],
  });
  protected readonly messages = signal<HelpMessage[]>([
    {
      id: 0,
      role: 'assistant',
      content: 'Hello! Ask me about jewellery, gifts, occasions, or your budget.',
    },
  ]);
  private nextMessageId = 1;

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected submitQuestion(): void {
    const question = this.form.controls.question.value.trim();
    if (this.loading()) {
      return;
    }
    if (!question) {
      this.form.controls.question.markAsTouched();
      return;
    }

    const previousTurns = this.messages().map(({ role, content }) => ({ role, content }));
    this.messages.update((messages) => [
      ...messages,
      { id: this.nextMessageId++, role: 'user', content: question },
    ]);
    this.form.reset();
    this.errorMessage.set('');
    this.loading.set(true);

    this.assistant
      .ask(question, previousTurns)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reply) => {
          this.messages.update((messages) => [
            ...messages,
            {
              id: this.nextMessageId++,
              role: 'assistant',
              content: reply.message,
              products: reply.products,
            },
          ]);
        },
        error: (error: unknown) => {
          console.error('AI Help request failed.', error);
          this.errorMessage.set('AI Help could not respond right now. Please try again.');
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  protected clearChat(): void {
    this.messages.set([
      {
        id: this.nextMessageId++,
        role: 'assistant',
        content: 'Chat cleared. What jewellery can I help you find?',
      },
    ]);
    this.errorMessage.set('');
  }
}
