import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  views: number;
  readingMinutes?: number;
  commentCount?: number;
}

export interface Category {
  name: string;
  slug: string;
  postCount: number;
  color: string;
}

export const heroSlides: Post[] = [];

export const latestPosts: Post[] = [];

export const categories: Category[] = [];
