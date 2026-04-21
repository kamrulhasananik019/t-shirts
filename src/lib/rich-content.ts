import type { RichDescription, TipTapNode } from '@/types/rich-content';

export type FAQItem = {
  question: string;
  answer: string;
};

function tiptapToPlainText(nodes: TipTapNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.text ?? '';
      }

      if (!node.content?.length) {
        return '';
      }

      return tiptapToPlainText(node.content);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function richContentToPlainText(content?: RichDescription): string {
  if (!content) return '';
  return tiptapToPlainText(content.content ?? []);
}

export function isSameRichContent(a?: RichDescription, b?: RichDescription): boolean {
  return richContentToPlainText(a) === richContentToPlainText(b);
}

export function extractFAQsFromRichContent(content?: RichDescription): FAQItem[] {
  if (!content) return [];
  return [];
}
