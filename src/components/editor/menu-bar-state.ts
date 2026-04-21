import type { Editor, EditorStateSnapshot } from '@tiptap/react';

export function menuBarStateSelector(ctx: EditorStateSnapshot<Editor | null>) {
  const editor = ctx.editor;
  if (!editor) {
    return {
      isBold: false,
      canBold: false,
      isItalic: false,
      canItalic: false,
      isStrike: false,
      canStrike: false,
      isCode: false,
      canCode: false,
      isUnderline: false,
      canUnderline: false,
      isParagraph: false,
      isHeading1: false,
      isHeading2: false,
      isHeading3: false,
      isHeading4: false,
      isBulletList: false,
      isOrderedList: false,
      isCodeBlock: false,
      isBlockquote: false,
      canUndo: false,
      canRedo: false,
    };
  }

  return {
    isBold: editor.isActive('bold') ?? false,
    canBold: editor.can().chain().toggleBold().run() ?? false,
    isItalic: editor.isActive('italic') ?? false,
    canItalic: editor.can().chain().toggleItalic().run() ?? false,
    isStrike: editor.isActive('strike') ?? false,
    canStrike: editor.can().chain().toggleStrike().run() ?? false,
    isCode: editor.isActive('code') ?? false,
    canCode: editor.can().chain().toggleCode().run() ?? false,
    isUnderline: editor.isActive('underline') ?? false,
    canUnderline: editor.can().chain().toggleUnderline().run() ?? false,
    isParagraph: editor.isActive('paragraph') ?? false,
    isHeading1: editor.isActive('heading', { level: 1 }) ?? false,
    isHeading2: editor.isActive('heading', { level: 2 }) ?? false,
    isHeading3: editor.isActive('heading', { level: 3 }) ?? false,
    isHeading4: editor.isActive('heading', { level: 4 }) ?? false,
    isBulletList: editor.isActive('bulletList') ?? false,
    isOrderedList: editor.isActive('orderedList') ?? false,
    isCodeBlock: editor.isActive('codeBlock') ?? false,
    isBlockquote: editor.isActive('blockquote') ?? false,
    canUndo: editor.can().chain().undo().run() ?? false,
    canRedo: editor.can().chain().redo().run() ?? false,
  };
}

export type MenuBarState = ReturnType<typeof menuBarStateSelector>;
