import type { TipTapDoc } from '@/types/rich-content';

export type RichTextContent = TipTapDoc;

export interface Category {
  _id: string;
  slug: string;
  name: string;
  shortDescription?: RichTextContent;
  description: RichTextContent;
  image: {
    url: string;
    alt: string;
  };
  parentId: string | null;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    image: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  shortDescription: RichTextContent;
  description: RichTextContent;
  images: {
    url: string;
    alt: string;
  }[];
  badges: string[];
  categoryIds: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    image: string;
  };
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
