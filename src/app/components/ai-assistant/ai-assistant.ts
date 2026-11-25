import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssistantTurn } from '../../models/assistant.model';
import { Product } from '../../models/product.model';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { ProductCardComponent } from '../product-card/product-card';

interface ChatMessage extends AssistantTurn {
  id: number;
  products?: Product[];
}

@Component({
  selector: 'app-ai-assistant',
  imports: [ProductCardComponent, ReactiveFormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
})
export class AiAssistantComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly assistant = inject(AiAssistantService);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly form = this.formBuilder.nonNullable.group({
    question: ['', Validators.required],
  });
  protected readonly messages = signal<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      content:
        'Hello, I can help you explore the DIYA collection. Ask me about gifts, occasions, materials, or your budget.',
    },
  ]);
  private nextMessageId = 1;

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
          console.error('Jewellery assistant request failed.', error);
          this.errorMessage.set(
            'The assistant could not respond right now. Please try again in a moment.',
          );
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
