import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MarkdownModule } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {MatStepperModule} from '@angular/material/stepper';


export interface Post {
  title: string;
  description: string;
  category: string;
  route: string;
  slug: string;
  tags: string[];
  draft: false;
}

export interface Article extends Post {
  updatedAt: string;
  createdAt: string;
  author: string;
  youtube: string;
  md: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MarkdownModule, MatStepperModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);
  title = 'Demo: Workshop Angular com Gemini';
  selectedStep = signal(1);
  steps: { name: string; content: string}[] = [];
  article = signal('');

  async ngOnInit() {
    const content1 = await this.getArticle('/step1.md');
    const content2 = await this.getArticle('/step2.md');
    const content3 = await this.getArticle('/step3.md');
    this.steps = [
      { name: 'Exemplo 1', content: content1 },
      { name: 'Exemplo 2', content: content2 },
      { name: 'Exemplo 3', content: content3 },
    ]
    this.article.set(content1);
  }

  selectStep(index: number) {
    this.article.set(this.steps[index].content);
  }

  private async getArticle(filename: string): Promise<string> {
    const file = await firstValueFrom(
      this.http.get(filename, {
        responseType: 'text',
      })
    );
    return file || '';
  }
}
