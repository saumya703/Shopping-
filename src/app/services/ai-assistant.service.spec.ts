import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import {
  AI_ASSISTANT_ENDPOINT,
  AiAssistantService,
} from './ai-assistant.service';

describe('AiAssistantService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('uses clearly labelled local catalogue matching when no proxy is configured', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const assistant = TestBed.inject(AiAssistantService);

    const reply = await firstValueFrom(assistant.ask('Suggest a gift under $500'));

    expect(assistant.isDemoMode).toBe(true);
    expect(reply.mode).toBe('demo');
    expect(reply.message).toContain('not AI');
    expect(reply.products.map((product) => product.id)).toEqual(['mini-hoops']);
  });

  it('sends catalogue context to a configured proxy and resolves only known product IDs', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AI_ASSISTANT_ENDPOINT, useValue: '/api/jewellery-assistant' },
      ],
    });
    const assistant = TestBed.inject(AiAssistantService);
    const http = TestBed.inject(HttpTestingController);
    const replyPromise = firstValueFrom(assistant.ask('Recommend everyday earrings'));
    const request = http.expectOne('/api/jewellery-assistant');

    expect(request.request.method).toBe('POST');
    expect(request.request.body.question).toBe('Recommend everyday earrings');
    expect(request.request.body.products.length).toBe(8);
    request.flush({
      message: 'These hoops are a lovely everyday option.',
      productIds: ['mini-hoops', 'unknown-product'],
    });

    const reply = await replyPromise;
    expect(assistant.isDemoMode).toBe(false);
    expect(reply.mode).toBe('proxy');
    expect(reply.products.map((product) => product.id)).toEqual(['mini-hoops']);
  });

  it('rejects empty or malformed proxy replies', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AI_ASSISTANT_ENDPOINT, useValue: '/api/jewellery-assistant' },
      ],
    });
    const assistant = TestBed.inject(AiAssistantService);
    const http = TestBed.inject(HttpTestingController);
    const replyPromise = firstValueFrom(assistant.ask('Find an anniversary gift'));
    http.expectOne('/api/jewellery-assistant').flush({ message: '  ', productIds: [] });

    await expect(replyPromise).rejects.toThrowError(TypeError);
  });
});
