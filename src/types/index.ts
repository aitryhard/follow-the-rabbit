export interface SearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

export interface RabbitMark {
  text: string;
  target: string;
}

export interface ArticleData {
  title: string;
  html: string;
  headHtml: string;
  rabbitMarks: RabbitMark[];
  isRabbit: boolean;
  currentStep: number;
  totalSteps: number;
}

export interface TrailState {
  steps: string[];
  currentStep: number;
  totalSteps: number;
  seed: string;
}
