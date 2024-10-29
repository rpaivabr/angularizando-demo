Vamos aprender juntos como integrar o gemini-pro na nossa aplicação angular e criar nosso próprio assistente virtual baseado em LLM. Todos os links e passo a passo também se encontram neste [GitHub NgGeminiSpeech](https://github.com/rpaivabr/ng-gemini-speech). 

## Criando App Inicial

### Instalando Dependências do projeto

Utilizando no terminal o angular cli, vamos criar uma nova aplicação com o comando `ng new ng-gemini`, selecionar as opções (estilo: scss, ssr: não) e adicionar a lib do angular material com o comando `ng add @angular/material`, neste caso quando perguntado sobre o tema, utilizaremos a opção "custom":

```
npm i -g @angular/cli
ng version
ng new ng-gemini
// Which stylesheet format would you like to use? scss
// Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? No

cd ng-gemini
ng add @angular/material
// Choose a prebuilt theme name, or "custom" for a custom theme: Custom
// Set up global Angular Material typography styles? Yes
// Include the Angular animations module? Include and enable animations
```

Também vamos instalar outras dependências, incluindo a principal para este exercício, sobre o uso do gemini:

```
npm i @google/generative-ai@^0.16.0
npm i ngx-markdown marked@^9.0.0
npm i -D @types/dom-speech-recognition@0.0.4
```

tsconfig.app.json
```typescript
/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": ["dom-speech-recognition"]
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}
```

### Criando Layout Base

src/styles.scss
```css
// Custom Theming for Angular Material
@use '@angular/material' as mat;
@include mat.core();

$theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: mat.$violet-palette,
    tertiary: mat.$green-palette,
  ),
  density: (
    scale: 0,
  )
));

// Include theme styles for core and each component used in your app.
// Alternatively, you can import and @include the theme mixins for each component
// that you are using.
:root {
  @include mat.all-component-themes($theme);
  @include mat.color-variants-backwards-compatibility($theme);
  --color-surface-container: #{mat.get-theme-color($theme, surface-container)};
  --color-surface-container-highest: #{mat.get-theme-color($theme, surface-container-highest)};
  --color-surface-container-lowest: #{mat.get-theme-color($theme, surface-container-lowest)};
  --color-surface-container-low: #{mat.get-theme-color($theme, surface-container-low)};
  --color-neutral-20: #{mat.get-theme-color($theme, neutral, 20)};
  --color-neutral-30: #{mat.get-theme-color($theme, neutral, 30)};
  --mat-sidenav-container-shape: 0;
}

/* You can add global styles to this file, and also import other style files */

html,
body {
  height: 100%;
}

body {
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}

h1,
h2 {
  font-size: 22px;
  line-height: 28px;
  letter-spacing: normal;
}

h1 {
  font-weight: 500;
}

h2 {
  font-weight: 400;
}

// scrollbar
::-webkit-scrollbar,
::-webkit-scrollbar-corner {
  background: transparent;
  height: 12px;
  width: 12px;
}

::-webkit-scrollbar-button {
  height: 0;
  width: 0;
}

:hover::-webkit-scrollbar-thumb {
  color: #dadce0;
}

::-webkit-scrollbar-thumb {
  background: content-box currentColor;
  border: 2px solid transparent;
  border-radius: 8px;
  color: #dadce0;
  min-height: 30px;
  min-width: 30px;
}
```

src/app/app.component.ts
```typescript
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownComponent } from 'ngx-markdown';
import { ChatContent } from './models/chat-content';
import { LineBreakPipe } from './pipes/line-break.pipe';
import { ChatService } from './services/chat.service';
import { SpeechService } from './services/speech.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, MatToolbarModule, MatFormFieldModule, MatInputModule, MatIconModule, MarkdownComponent, LineBreakPipe, JsonPipe, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private chatService = inject(ChatService);
  private speechService = inject(SpeechService);

  title = 'Angular AI Assistant';
  contents: ChatContent[] = [];
  message = computed(() => this.speechService.message())

  isSpeakerOn = this.speechService.isSpeakerOn;
  isRecording = this.speechService.isRecording;

  toggleSpeaker() {
    this.speechService.toggleSpeaker();
  }

  startRecording() {
    this.speechService.startRecording();
  }

  stopRecording() {
    this.speechService.stopRecording();
  }

  sendMessage(): void {
    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message(),
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [...this.contents, chatContent, loadingContent];

    this.chatService.chat(chatContent).subscribe({
      next: (content) => {
        this.contents = [
          ...this.contents.filter((content) => !content.loading),
          content
        ];
        this.speechService.speech(content.message);
      }, error: () => {
        const errorContent: ChatContent = {
          agent: 'chatbot',
          message: 'Não entendi, poderia repetir por favor?'
        }
        this.contents = [
          ...this.contents.filter((content) => !content.loading),
          errorContent,
        ];
        this.speechService.speech(errorContent.message);
      }
    });

    this.speechService.clearContent();
  }
}
```

src/app/app.component.html
```
<mat-toolbar>
  <h1>{{ title }}</h1>
  <span class="separator"></span>
  <mat-icon (click)="toggleSpeaker()">{{ isSpeakerOn() ? 'volume_up' : 'volume_off' }}</mat-icon>
</mat-toolbar>

<main>
  <div class="chat-container">
    @for (content of contents; let i = $index; track i) {
    <div class="chat-message {{ content.agent }}">
      <img
        class="avatar"
        [src]="'avatar-' + content.agent + '.png'"
        [alt]="content.agent + 'icon'"
      />
      <div class="message-details">
        <markdown
          class="message-content"
          [class.loading]="content.loading"
          [data]="content.message | lineBreak"
        />
      </div>
    </div>
    } @empty {
    <div class="message-container">
      <p class="message">
        Welcome to your Gemini ChatBot App <br />
        Write a text to start.
      </p>
    </div>
    }
  </div>
  
  <div class="chat-footer-container">
    <mat-form-field class="chat-input">
      <input
        matInput
        disabled
        placeholder="Record a message"
        [value]="message()"
        (keyup.enter)="sendMessage()"
      />
    </mat-form-field>
    @if (this.isRecording()) {
      <button mat-icon-button (click)="stopRecording()">
        <mat-icon>mic</mat-icon>
      </button>
    } @else {
      <button mat-icon-button (click)="startRecording()">
        <mat-icon>mic_off</mat-icon>
      </button>
    }
    <button
      mat-icon-button
      color="accent"
      [disabled]="!message"
      (click)="sendMessage()"
    >
      <mat-icon color="accent">send</mat-icon>
    </button>
  </div>
</main>
```

src/app/app.component.scss
```css
:host {
  display: block;
  width: 100%;
  height: 100dvh;
  background-color: var(--color-surface-container-lowest);

  main {
    height: calc(100% - 56px);
    width: 100%;
    display: flex;
    flex-direction: column;

    @media (min-width: 800px) {
      height: calc(100% - 64px);
    }
  }

  .mat-toolbar {
    background-color: var(--color-surface-container-lowest);
    border-bottom: 1px solid var(--color-neutral-30);

    .separator {
      flex: 1;
    }
  }

  .chat-input {
    padding-top: 20px;
    width: calc(100% - 48px);
  }

  .user {
    background-color: var(--color-surface-container-highest);
  }

  .chatbot {
    background-color: var(--color-surface-container);
  }

  .chat-footer-container {
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
  }

  .chat-container {
    overflow: auto;
    padding: 0 10px 0 10px;
    height: 100%;
  }

  .chat-message {
    display: flex;
    align-items: flex-start;
    padding: 10px;
    margin-top: 10px;
    border-radius: 10px;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .message-details {
    flex: 1;
    align-self: center;
  }

  .username {
    font-weight: bold;
    color: #333;
  }

  .message-content {
    margin: 5px 0;
    color: var(--mat-toolbar-container-text-color);
  }

  .message-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .message {
    text-align: center;
    color: var(--mat-toolbar-container-text-color);
    padding: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .loading {
    animation: fadeIn 1s ease-in-out infinite;
  }
}
```

## Criação das Features

Vamos utilizar via terminal o angular cli para agilizar a criação dos componentes (pages) e dos serviços (services), criar nossos modelos (interface e type), pipe e imagens para os avatares, e configurar o módulo markdown bem como as rotas da aplicação:

terminal
```
ng generate service services/chat
ng generate service services/speech
```

src/app/models/chat-content.ts
```typescript
export interface ChatContent {
  agent: 'user' | 'chatbot';
  message: string;
  loading?: boolean;
  imagePreview?: string;
}
```

src/app/pipes/line-break.pipe.ts
```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lineBreak',
  standalone: true
})
export class LineBreakPipe implements PipeTransform {

  transform(value: string): string {
    return value.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  }

}
```

src/assets/avatar-chatbot.png
[Link da pasta com as imagens](https://github.com/angularizando/2024-04-04-ng-gemini/tree/main/public)

src/assets/avatar-user.png
[Link da pasta com as imagens](https://github.com/angularizando/2024-04-04-ng-gemini/tree/main/public)

src/app/app-config.ts
```typescript
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MarkdownModule } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideAnimationsAsync(),
    importProvidersFrom([MarkdownModule.forRoot()]),
  ]
};
```

### Chat (Gemini)

src/app/services/chat.service.ts 
```typescript
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatContent } from '../models/chat-content';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  genAI = new GoogleGenerativeAI('AIzaSyCtS9lnta8OxsmmDSUVXKkcAx1J-WCy8pI');
  model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  chatSession = this.model.startChat({ history: [] });

  chat(chatContent: ChatContent): Observable<ChatContent> {
    return from(this.chatSession.sendMessage(chatContent.message)).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          agent: 'chatbot',
          message: text,
        };
      })
    );
  }
}
```

### Speech Synthesis e Recognition (Browser APIs)

src/app/services/speech.service.ts 
```typescript
import { Injectable, signal } from '@angular/core';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private synthesis = window.speechSynthesis;
  private speechRecognition: SpeechRecognition | null = null;
  private isSpeakerOnState = signal(true);
  private isRecordingState = signal(false);
  private messageState = signal('');

  isSpeakerOn = this.isSpeakerOnState.asReadonly();
  isRecording = this.isRecordingState.asReadonly();
  message = this.messageState.asReadonly();

  toggleSpeaker(): void {
    if (this.synthesis.speaking && this.isSpeakerOn()) {
      this.synthesis.cancel();
    }
    this.isSpeakerOnState.update(value => !value);
  }

  speech(text: string) {
    if (!this.isSpeakerOn()) return;

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "pt-BR";
    utterance.text = text
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '')
      .replaceAll('*', '').replaceAll('#', '');
    this.synthesis.speak(utterance);
  }

  clearContent() {
    this.stopRecording();
    this.messageState.set('');
  }

  startRecording() {
    this.isRecordingState.set(true);

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    const isSpeechRecognitionAPIAvailable =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    if (!isSpeechRecognitionAPIAvailable) {
      alert('Infelizmente seu navegador não suporte a API de gravação!');
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognitionAPI();
    this.speechRecognition.lang = 'pt-BR';
    this.speechRecognition.continuous = true;
    this.speechRecognition.maxAlternatives = 1;
    this.speechRecognition.interimResults = false;
    fromEvent(this.speechRecognition, 'result').subscribe((event: Event) => {
      const { results } = <SpeechRecognitionEvent>event;

      const transcription = Array.from(results).reduce(
        (text, result) => text.concat(result[0].transcript),
        ''
      );
      this.messageState.set(transcription);
    });
    fromEvent(this.speechRecognition, 'error').subscribe(console.error);
    this.speechRecognition.start();
  }

  stopRecording() {
    this.isRecordingState.set(false);

    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }
}
```

## Customização

### Material You Theme | Colors

src/styles.scss
```css
$theme: matx.define-theme(
  (
    color: (
      theme-type: dark,
      primary: matx.$m3-violet-palette,
      tertiary: matx.$m3-green-palette,
    ),
  )
);

// theme-type: dark|light
// primary|tertiary: $m3-red-palette|$m3-green-palette|$m3-blue-palette|$m3-yellow-palette| 
//      $m3-cyan-palette| $m3-magenta-palette| $m3-orange-palette|$m3-chartreuse-palette| 
//      $m3-azure-palette| $m3-violet-palette| $m3-rose-palette;
```
