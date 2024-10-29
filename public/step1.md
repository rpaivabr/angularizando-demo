## Criando App Inicial Básico

Vamos aprender juntos como utilizar o gemini-pro na nossa aplicação angular da forma mais simples, assim como é recomendado no site oficial. O exemplo abaixo foi adaptado do site [Tutorial: primeiros passos com a API Gemini](https://ai.google.dev/gemini-api/docs/get-started/tutorial?lang=node&authuser=1&%3Bhl=ko&hl=pt-br). 

### Instalando Dependências do projeto

Utilizando no terminal o angular cli, vamos criar uma nova aplicação com o comando `ng new teste-gemini`, selecionar as opções (estilo: scss, ssr: não):

```
npm i -g @angular/cli 

ng new teste-gemini

// Which stylesheet format would you like to use? scss
// Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? No

cd teste-gemini
```

Também vamos instalar outras dependências, incluindo a principal para este exercício, sobre o uso do gemini:

```
npm install @google/generative-ai
```

### Gerar texto com base em uma entrada somente de texto

src/app/app.component.ts
```typescript
import { Component } from '@angular/core';
import { GoogleGenerativeAI } from "@google/generative-ai";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  genAI = new GoogleGenerativeAI('AIzaSyAaQLHQDUnv40MeNfCObsyA_bDVjWaBIq4');
  model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  response = '';

  async generateContent(prompt: string) {
    const result = await this.model.generateContent(prompt);
    const response = result.response;
    this.response = response.text();
  }

}
```

src/app/app.component.html
```
<input #prompt
  placeholder="Digite o prompt" 
  value="Write a story about a magic backpack." />
<button (click)="generateContent(prompt.value)">Gerar texto</button>

<p>{{response}}</p>
```
