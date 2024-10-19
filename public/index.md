Vamos aprender juntos como integrar o gemini-pro na nossa aplicação angular e criar nosso próprio assistente virtual baseado em LLM. Todos os links e passo a passo também se encontram neste [GitHub NgGemini](https://github.com/angularizando/2024-04-04-ng-gemini). 

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
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
```

src/app/app.component.html
```
<mat-drawer-container autosize>
  <mat-drawer opened mode="side">
    <h2>Gemini</h2>

    <div style="display: flex; flex-direction: column">
      <button
        mat-button
        color="primary"
        routerLink="text"
        routerLinkActive="selected"
      >
        <mat-icon>chat_bubble</mat-icon>
        Text
      </button>
      <button
        mat-button
        color="primary"
        routerLink="chat"
        routerLinkActive="selected"
      >
        <mat-icon>subject</mat-icon>
        Chat
      </button>
      <button
        mat-button
        color="primary"
        routerLink="vision"
        routerLinkActive="selected"
      >
        <mat-icon>image</mat-icon>
        Vision
      </button>
    </div>
  </mat-drawer>

  <mat-toolbar>
    <h1>Build with AI and Angular</h1>
  </mat-toolbar>

  <main>
    <router-outlet />
  </main>
</mat-drawer-container>
```

src/app/app.component.scss
```css
.mat-drawer-container {
  width: 100%;
  height: 100vh;
  background-color: var(--color-surface-container-lowest);
}

.mat-drawer {
  width: 272px;
  padding: 0 20px;
  border-right: 1px solid var(--color-neutral-30);
  background-color: var(--color-surface-container-low);
}

.mat-toolbar {
  background-color: var(--color-surface-container-lowest);
  border-bottom: 1px solid var(--color-neutral-30);
}

main {
  display: flex;
  flex-direction: column;
  height: calc(100% - 64px);
  width: 100%;
}

.selected {
  background-color: var(--mdc-filled-button-container-color);
  color: var(--mdc-filled-button-label-text-color) !important;
}
```

## Criação das Features

Vamos utilizar via terminal o angular cli para agilizar a criação dos componentes (pages) e dos serviços (services), criar nossos modelos (interface e type), pipe e imagens para os avatares, e configurar o módulo markdown bem como as rotas da aplicação:

terminal
```
ng generate component pages/text
ng generate component pages/chat
ng generate component pages/vision

ng generate service services/text
ng generate service services/chat
ng generate service services/vision
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

src/app/models/image-file.ts
```typescript
export type ImageFile = {
  preview: string;
  file: File;
};
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
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { MarkdownModule } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom([MarkdownModule.forRoot()]),
  ],
};
```

src/app/app.routes.ts
```typescript
import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { TextComponent } from './pages/text/text.component';
import { VisionComponent } from './pages/vision/vision.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'text' },
  { path: 'chat', component: ChatComponent },
  { path: 'text', component: TextComponent },
  { path: 'vision', component: VisionComponent },
];
```

### Text

Nesta primeira feature vamos utilizar a api do gemini-pro para gerar um conteúdo a partir de um texto. Assim, cada pergunta é tratada de forma única, ou seja, a resposta não entende contexto de pedidos anteriores.

src/app/services/text.service.ts 
```typescript
import { Injectable } from '@angular/core';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Observable, from, map } from 'rxjs';
import { ChatContent } from '../models/chat-content';

@Injectable({
  providedIn: 'root',
})
export class TextService {
  private model: GenerativeModel;

  constructor() {
    const genAI = new GoogleGenerativeAI(localStorage.getItem('API_KEY')!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  generateText(message: string): Observable<ChatContent> {
    return from(this.model.generateContent(message)).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          message: text,
          agent: 'chatbot',
        };
      })
    );
  }
}
```

src/app/pages/text.component.ts 
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MarkdownModule } from 'ngx-markdown';
import { LineBreakPipe } from '../../pipes/line-break.pipe';
import { TextService } from '../../services/text.service';
import { ChatContent } from '../../models/chat-content';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MarkdownModule,
    LineBreakPipe,
  ],
  templateUrl: './text.component.html',
  styleUrl: './text.component.scss',
})
export class TextComponent {
  private textService = inject(TextService);
  contents: ChatContent[] = [];
  message: string = '';

  generateText(): void {
    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message,
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [
      ...this.contents,
      chatContent,
      loadingContent,
    ];

    this.message = '';

    this.textService.generateText(chatContent.message).subscribe((content) => {
      this.contents = [
        ...this.contents.filter((content) => !content.loading),
        content,
      ];
    });
  }
}
```

src/app/pages/text.component.html 
```
<div class="chat-container">
  @for (content of contents; let i = $index; track i) {
    <div class="chat-message {{content.agent}}">
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
      Welcome to your Gemini App for text generation. <br />
      Write an instruction to start.
    </p>
  </div>
  }
</div>

<div class="chat-footer-container">
  <mat-form-field class="chat-input">
    <input
      placeholder="Send a message"
      matInput
      [(ngModel)]="message"
      (keyup.enter)="generateText()"
    />
  </mat-form-field>
  <button
    mat-icon-button
    color="accent"
    [disabled]="!message"
    (click)="generateText()"
  >
    <mat-icon color="accent">send</mat-icon>
  </button>
</div>
```

src/app/pages/text.component.scss 
```css
:host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

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

### Chat

Já no chat, a gente precisa iniciar o chat via api do gemini-pro (podendo ter um histórico prévio ou não), e a partir daí toda nova mensagem para a api vai gerando um histórico, com isso as próximas respostas sempre levam em conta a pergunta e o contexto das últimas mensagens.

src/app/services/chat.service.ts 
```typescript
import { Injectable } from '@angular/core';
import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { Observable, from, map } from 'rxjs';
import { ChatContent } from '../models/chat-content';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private model: GenerativeModel;
  private chatSession: ChatSession;
  
  constructor() {
    const genAI = new GoogleGenerativeAI(localStorage.getItem('API_KEY')!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.chatSession = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{
            text: `You're a poet. Respond to all questions with a rhyming poem.
            What is the capital of California?
          `}],
        },
        {
          role: 'model',
          parts: [{ text: 'If the capital of California is what you seek, Sacramento is where you ought to peek.' }],
        },
      ],
    });
  }

  chat(chatContent: ChatContent): Observable<ChatContent> {
    return from(this.chatSession.sendMessage(chatContent.message)).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          message: text,
          agent: 'chatbot',
        };
      })
    );
  }
}
```

src/app/pages/chat.component.ts 
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MarkdownComponent } from 'ngx-markdown';
import { LineBreakPipe } from '../../pipes/line-break.pipe';
import { ChatService } from '../../services/chat.service';
import { ChatContent } from '../../models/chat-content';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MarkdownComponent,
    LineBreakPipe,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  private chatService = inject(ChatService);
  contents: ChatContent[] = [];
  message: string = '';

  sendMessage(): void {
    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message,
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [...this.contents, chatContent, loadingContent];

    this.message = '';

    this.chatService.chat(chatContent).subscribe((content) => {
      this.contents = [
        ...this.contents.filter((content) => !content.loading),
        content,
      ];
    });
  }
}
```

src/app/pages/chat.component.html 
```
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
      placeholder="Send a message"
      [(ngModel)]="message"
      (keyup.enter)="sendMessage()"
    />
  </mat-form-field>
  <button
    mat-icon-button
    color="accent"
    [disabled]="!message"
    (click)="sendMessage()"
  >
    <mat-icon color="accent">send</mat-icon>
  </button>
</div>
```

src/app/pages/chat.component.scss 
```css
:host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

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

### Vision

Já na última feature, utilizaremos o modelo gemini-1.5-flash, com isso pediremos para ele gerar uma resposta, assim como no primeiro caso, mas a diferença é que podemos não só mandar uma mensagem como parâmetro inicial, mas podemos mandar uma lista multimodal (mensagem de texto, imagens e/ou vídeos). O modelo responderá de acordo com o que melhor se encaixar levando em conta a combinação de todas as entradas juntas.

src/app/services/vision.service.ts 
```typescript
import { Injectable } from '@angular/core';
import {
  GenerativeModel,
  GoogleGenerativeAI,
  InlineDataPart,
} from '@google/generative-ai';
import { Observable, from, map } from 'rxjs';
import { ChatContent } from '../models/chat-content';
import { ImageFile } from '../models/image-file';

@Injectable({
  providedIn: 'root',
})
export class VisionService {
  private model: GenerativeModel;

  constructor() {
    const genAI = new GoogleGenerativeAI(localStorage.getItem('API_KEY')!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  vision(message: string, imageFile: ImageFile): Observable<ChatContent> {
    console.log(message, imageFile);
    const imageDataPart: InlineDataPart = {
      inlineData: {
        data: imageFile.preview.substring(imageFile.preview.indexOf(',') + 1),
        mimeType: imageFile.file.type,
      },
    };

    return from(this.model.generateContent([message, imageDataPart])).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          message: text,
          agent: 'chatbot',
        };
      })
    );
  }
}
```

src/app/pages/vision.component.ts 
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LineBreakPipe } from '../../pipes/line-break.pipe';
import { VisionService } from '../../services/vision.service';
import { ChatContent } from '../../models/chat-content';
import { ImageFile } from '../../models/image-file';

@Component({
  selector: 'app-vision',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LineBreakPipe,
  ],
  templateUrl: './vision.component.html',
  styleUrl: './vision.component.scss',
  host: {
    class: 'contents',
  },
})
export class VisionComponent {
  private visionService = inject(VisionService);
  contents: ChatContent[] = [];
  message: string = '';
  imageFile?: ImageFile;

  removeImage() {
    this.imageFile = undefined;
  }

  sendMessage(): void {
    if (!this.imageFile) {
      return;
    }

    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message,
      imagePreview: this.imageFile.preview,
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [
      ...this.contents,
      chatContent,
      loadingContent,
    ];

    this.visionService.vision(this.message, this.imageFile).subscribe((content) => {
      this.contents = [
        ...this.contents.filter((content) => !content.loading),
        content,
      ];
    });

    this.message = '';
    this.imageFile = undefined;
  }

  selectImage(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const preview = e.target?.result as string;
        this.imageFile = { file, preview };
      };

      reader.readAsDataURL(file);
    }
  }
}
```

src/app/pages/vision.component.html 
```
<div class="chat-container">
  @for (content of contents; let i = $index; track i) {
  <div class="chat-message {{ content.agent }}">
    <img
      class="avatar"
      [src]="'avatar-' + content.agent + '.png'"
      [alt]="content.agent + 'icon'"
    />
    <div class="message-details">
      @if (content.imagePreview) {
      <img [src]="content.imagePreview" height="150px" alt="Preview" />
      }
      <p
        class="message-content"
        [class.loading]="content.loading"
        [innerHTML]="content.message | lineBreak"
      ></p>
    </div>
  </div>
  } @empty {
  <div class="message-container">
    <p class="message">
      Welcome to your Gemini Vision App <br />
      Write a text and attach an image to start.
    </p>
  </div>
  }
</div>

<div class="chat-footer-container">
  <mat-form-field class="chat-input">
    @if(imageFile) {
    <div class="image-preview">
      <img [src]="imageFile.preview" width="100px" alt="Preview" />
      <button
        mat-icon-button
        matTooltip="Remove"
        color="warn"
        (click)="this.imageFile = undefined; inputImage.value = ''"
      >
        <mat-icon class="custom-icon-size">close</mat-icon>
      </button>
    </div>
    }
    <input
      placeholder="Send a message"
      matInput
      [(ngModel)]="message"
      (keyup.enter)="sendMessage()"
    />

    <button mat-icon-button matSuffix class="image-upload-button">
      <input
        #inputImage
        type="file"
        accept="image/png, image/jpeg, image/webp"
        (change)="selectImage($event)"
      />
      <mat-icon color="primary">add_photo_alternate</mat-icon>
    </button>
  </mat-form-field>
  <button
    mat-icon-button
    color="accent"
    [disabled]="!imageFile || !message"
    (click)="sendMessage(); inputImage.value = ''"
  >
    <mat-icon color="accent">send</mat-icon>
  </button>
</div>
```

src/app/pages/vision.component.scss 
```css
:host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

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

  .image-upload-button {
    input[type="file"] {
      font-size: 100px;
      left: 0;
      opacity: 0;
      position: absolute;
      top: 0;
      z-index: 1;
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

Conforme também explicado em vídeo, optamos pelos serviços consumirem a chave "API_KEY" através do localstorage, porque deste modo não precisamos subir um dado sensível ao versionar o código no github, ou constar a chave no código frontend em produção. Para criamos essa chave, precisamos acessar a página do [AI Studio API keys](https://aistudio.google.com/app/apikey). Esta chave para utilização dos modelos mencionados nos exemplos acima (gemini-pro e gemini-1.5-flash) é gratuita com restrições de uso (RPM - requisições por minuto).

Também temos a página de documentação oficial sobre a biblioteca e seu uso para web no site [Google AI for Developers](https://ai.google.dev/tutorials/web_quickstart). Qualquer dúvida fique a vontade para entrar em contato comigo, vamos nos conectar, e espero que tenham gostado do conteúdo! Também sigam e compartilhem a página Angularizando no LinkedIn!
