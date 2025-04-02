export interface KeywordMap {
  [key: string]: string | string[];
}

export interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}