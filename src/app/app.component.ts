import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MarkdownModule } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  imports: [RouterOutlet, MatToolbarModule, MarkdownModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);
  title = 'demos';
  selectedStep = signal(2);
  steps = [
    { name: 'Before you begin', content: '' },
    { name: 'Get the code', content: '' },
    { name: 'Establish a baseline', content: '' },
  ];
  article = signal('');

  async ngOnInit() {
    const file = await this.getArticle();
    console.log(file);
    this.article.set(file);
  }


  async getArticle(): Promise<string> {
    const file = await firstValueFrom(
      this.http.get(`/index.md`, {
        responseType: 'text',
      })
    );
    return file || '';
  }
}
