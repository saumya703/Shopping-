import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AssistantReply } from '../../models/assistant.model';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AiHelpWidgetComponent } from './ai-help-widget';

describe('AiHelpWidgetComponent', () => {
  it('opens the widget and sends a question through the shared assistant service', async () => {
    let receivedQuestion = '';
    const reply: AssistantReply = {
      message: 'Here are a few pieces to explore.',
      products: [],
      mode: 'demo',
    };
    await TestBed.configureTestingModule({
      imports: [AiHelpWidgetComponent],
      providers: [
        provideRouter([]),
        {
          provide: AiAssistantService,
          useValue: {
            isDemoMode: true,
            ask: (question: string) => {
              receivedQuestion = question;
              return of(reply);
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AiHelpWidgetComponent);
    fixture.detectChanges();

    const launcher = fixture.nativeElement.querySelector('.help-launcher') as HTMLButtonElement;
    launcher.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Local demo · not AI');

    const input = fixture.nativeElement.querySelector('#ai-help-question') as HTMLInputElement;
    input.value = '  Suggest a gift under $500  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.question-form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(receivedQuestion).toBe('Suggest a gift under $500');
    expect(fixture.nativeElement.textContent).toContain(reply.message);
  });
});
