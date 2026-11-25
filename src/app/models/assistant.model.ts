import { Product } from './product.model';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  message: string;
  products: Product[];
  mode: 'demo' | 'proxy';
}
