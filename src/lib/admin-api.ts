import { cookies } from 'next/headers';

import { getAdminSessionCookieName, verifyAdminSession } from '@/lib/admin-auth';
import type { TipTapDoc } from '@/types/rich-content';

export async function requireAdminSession(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(getAdminSessionCookieName())?.value);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return { email: session.email };
}

function getEmbeddedDocText(value: { content?: unknown }): string | null {
  if (!Array.isArray(value.content) || value.content.length !== 1) return null;

  const paragraph = value.content[0] as { type?: string; content?: unknown };
  if (paragraph?.type !== 'paragraph') return null;
  if (!Array.isArray(paragraph.content) || paragraph.content.length !== 1) return null;

  const textNode = paragraph.content[0] as { type?: string; text?: unknown };
  if (textNode?.type !== 'text' || typeof textNode.text !== 'string') return null;

  return textNode.text;
}

function parseTipTapDoc(input: unknown, depth = 0): TipTapDoc | null {
  if (depth > 4) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;

    try {
      return parseTipTapDoc(JSON.parse(trimmed), depth + 1);
    } catch {
      return null;
    }
  }

  if (!input || typeof input !== 'object') return null;

  const candidate = input as { type?: string; content?: unknown };
  if (candidate.type !== 'doc') return null;
  if (!Array.isArray(candidate.content)) return null;

  const embeddedDocText = getEmbeddedDocText(candidate);
  if (embeddedDocText) {
    const embeddedDoc = parseTipTapDoc(embeddedDocText, depth + 1);
    if (embeddedDoc) return embeddedDoc;
  }

  return candidate as TipTapDoc;
}

export function toStoredRichText(input: unknown): string {
  const toDoc = (text: string): TipTapDoc => ({
    type: 'doc',
    content: text.trim()
      ? [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: text.trim() }],
          },
        ]
      : [],
  });

  if (typeof input !== 'string') {
    return JSON.stringify(toDoc(''));
  }

  const trimmed = input.trim();
  if (!trimmed) return JSON.stringify(toDoc(''));

  const parsed = parseTipTapDoc(trimmed);
  if (parsed) return JSON.stringify(parsed);

  return JSON.stringify(toDoc(trimmed));
}
