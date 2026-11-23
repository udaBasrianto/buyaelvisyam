export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  categories?: string[];
  tags: string[];
  author: string;
  date: string;
  views: number;
  readingMinutes?: number;
  commentCount?: number;
}
