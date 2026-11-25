import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';
import { AssistantReply, AssistantTurn } from '../models/assistant.model';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

export const AI_ASSISTANT_ENDPOINT = new InjectionToken<string | null>(
  'AI_ASSISTANT_ENDPOINT',
  { providedIn: 'root', factory: () => null },
);

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly productService = inject(ProductService);
  private readonly endpoint = inject(AI_ASSISTANT_ENDPOINT);

  readonly isDemoMode = !this.endpoint?.trim();

  ask(question: string, conversation: readonly AssistantTurn[] = []): Observable<AssistantReply> {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      throw new Error('Ask a jewellery question before requesting recommendations.');
    }

    const endpoint = this.endpoint?.trim();
    if (!endpoint) {
      return of(this.createDemoReply(trimmedQuestion)).pipe(delay(350));
    }

    const request = {
      question: trimmedQuestion,
      conversation: conversation.slice(-8),
      products: this.productService.products.map(
        ({ id, name, category, price, description, material, availableQuantity }) => ({
          id,
          name,
          category,
          price,
          description,
          material,
          availableQuantity,
        }),
      ),
    };

    return this.http
      .post<unknown>(endpoint, request)
      .pipe(map((response) => this.parseProxyResponse(response)));
  }

  private parseProxyResponse(value: unknown): AssistantReply {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('message' in value) ||
      typeof value.message !== 'string' ||
      value.message.trim().length === 0
    ) {
      throw new TypeError('The jewellery assistant proxy returned an invalid response.');
    }

    if ('productIds' in value && value.productIds !== undefined && !Array.isArray(value.productIds)) {
      throw new TypeError('The jewellery assistant proxy returned invalid product recommendations.');
    }

    const productIds =
      'productIds' in value && Array.isArray(value.productIds) ? value.productIds : [];
    const products = productIds
      .filter((id): id is string => typeof id === 'string')
      .map((id) => this.productService.getById(id))
      .filter((product): product is Product => product !== undefined);

    return { message: value.message, products, mode: 'proxy' };
  }

  private createDemoReply(question: string): AssistantReply {
    const normalized = question.toLocaleLowerCase();
    const budget = normalized.match(/under\s*\$?\s*(\d+)/)?.[1];
    let candidates = this.productService.products;

    if (budget) {
      const maxPrice = Number(budget);
      candidates = candidates.filter((product) => product.price <= maxPrice);
    }

    if (normalized.includes('earring') || normalized.includes('daily wear')) {
      candidates = candidates.filter((product) => product.category === 'Earrings');
    } else if (normalized.includes('necklace') || normalized.includes('black dress')) {
      candidates = candidates.filter((product) => product.category === 'Necklaces');
    } else if (normalized.includes('ring') || normalized.includes('diamond')) {
      candidates = candidates.filter((product) => product.category === 'Rings');
    } else if (normalized.includes('wedding') || normalized.includes('anniversary')) {
      candidates = candidates.filter((product) => product.featured);
    }

    const recommendations = candidates.slice(0, 3);
    const products =
      recommendations.length > 0
        ? recommendations
        : this.productService.products.filter((product) => !budget || product.price <= Number(budget)).slice(0, 3);

    const budgetText = budget ? ` priced under $${budget}` : '';
    const message =
      products.length > 0
        ? `Demo recommendation (not AI): here are catalogue pieces${budgetText} that may suit your request. These suggestions are matched locally from the DIYA product catalogue.`
        : `Demo recommendation (not AI): I couldn't find a catalogue piece within that budget. Try a higher budget or browse all DIYA pieces.`;

    return { message, products, mode: 'demo' };
  }
}
