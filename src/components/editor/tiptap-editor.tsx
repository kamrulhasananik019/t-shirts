'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { useEffect, useMemo, useRef } from 'react';

import { MenuBar } from '@/components/editor/menu-bar';
import styles from '@/components/editor/tiptap-editor.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
};

type EditorJsonContent = {
  type?: string;
  text?: string;
  content?: EditorJsonContent[];
  [key: string]: unknown;
};

function toDocFromText(value: string): EditorJsonContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: value ? [{ type: 'text', text: value }] : [],
      },
    ],
  };
}

function getEmbeddedDocText(value: EditorJsonContent): string | null {
  if (!Array.isArray(value.content) || value.content.length !== 1) return null;

  const paragraph = value.content[0] as { type?: string; content?: unknown };
  if (paragraph?.type !== 'paragraph') return null;
  if (!Array.isArray(paragraph.content) || paragraph.content.length !== 1) return null;

  const textNode = paragraph.content[0] as { type?: string; text?: unknown };
  if (textNode?.type !== 'text' || typeof textNode.text !== 'string') return null;

  return textNode.text;
}

function tryParseDoc(value: unknown, depth = 0): EditorJsonContent | null {
  if (depth > 4) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      return tryParseDoc(JSON.parse(trimmed), depth + 1);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== 'object') return null;

  const candidate = value as EditorJsonContent;
  if (candidate.type !== 'doc') return null;
  if (!Array.isArray(candidate.content)) return null;

  const embeddedDocText = getEmbeddedDocText(candidate);
  if (embeddedDocText) {
    const embeddedDoc = tryParseDoc(embeddedDocText, depth + 1);
    if (embeddedDoc) return embeddedDoc;
  }

  return candidate;
}

function parseToEditorContent(value: string): EditorJsonContent {
  const parsed = tryParseDoc(value);
  if (parsed) return parsed;
  return toDocFromText(value);
}

export function TipTapEditor({ value, onChange, minHeight = 180 }: Props) {
  const syncingRef = useRef(false);
  const initialContent = useMemo(() => parseToEditorContent(value), [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        underline: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      handleKeyDown(view, event) {
        const { state } = view;
        const { $from } = state.selection;

        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault();

          const splitPos = state.selection.from;
          const paragraphType = state.schema.nodes.paragraph;
          if (!paragraphType) {
            return false;
          }

          let tr = state.tr.split(splitPos);
          tr = tr.setBlockType(splitPos + 1, splitPos + 1, paragraphType);
          tr = tr.setStoredMarks([]);

          view.dispatch(tr.scrollIntoView());
          return true;
        }

        if (
          event.key === 'Enter' &&
          !event.shiftKey &&
          $from.parent.type.name === 'heading' &&
          $from.parentOffset === $from.parent.nodeSize - 2
        ) {
          event.preventDefault();

          const splitPos = state.selection.from;
          const paragraphType = state.schema.nodes.paragraph;
          if (!paragraphType) {
            return false;
          }

          let tr = state.tr.split(splitPos);
          tr = tr.setBlockType(splitPos + 1, splitPos + 1, paragraphType);
          view.dispatch(tr);
          return true;
        }

        return false;
      },
    },
    onUpdate({ editor: current }) {
      if (syncingRef.current) return;
      onChange(JSON.stringify(current.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = parseToEditorContent(value);
    const currentJson = JSON.stringify(editor.getJSON());
    const nextJson = JSON.stringify(next);
    if (currentJson === nextJson) return;
    syncingRef.current = true;
    editor.commands.setContent(next);
    syncingRef.current = false;
  }, [editor, value]);

  return (
    <div className={styles.wrapper}>
      <MenuBar editor={editor} />
      <div className={styles.editorContainer}>
        <div className={styles.textareaLike} style={{ minHeight }}>
          <EditorContent
            editor={editor}
            className={`${styles.tiptap} ${styles.proseMirror}`}
          />
        </div>
      </div>
    </div>
  );
}
