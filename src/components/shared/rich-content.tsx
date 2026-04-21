import type { RichDescription, TipTapNode, TipTapMark } from '@/types/rich-content';

type RichContentProps = {
  content: RichDescription;
  textClassName: string;
  listClassName?: string;
  listItemClassName?: string;
  wrapperClassName?: string;
};

export default function RichContent({
  content,
  textClassName,
  listClassName,
  listItemClassName,
  wrapperClassName,
}: RichContentProps) {
  const applyMarks = (nodeText: React.ReactNode, marks: TipTapMark[] | undefined, key: string) => {
    const safeMarks = Array.isArray(marks) ? marks : [];
    return safeMarks.reduce<React.ReactNode>((acc, mark, index) => {
      const markKey = `${key}-mark-${mark.type}-${index}`;
      if (mark.type === 'bold') return <strong key={markKey}>{acc}</strong>;
      if (mark.type === 'italic') return <em key={markKey}>{acc}</em>;
      if (mark.type === 'underline') return <u key={markKey}>{acc}</u>;
      if (mark.type === 'strike') return <s key={markKey}>{acc}</s>;
      if (mark.type === 'code') return <code key={markKey}>{acc}</code>;
      return <span key={markKey}>{acc}</span>;
    }, nodeText);
  };

  const getNodeText = (nodes: TipTapNode[]): string =>
    nodes
      .map((node) => {
        if (node.type === 'text') return node.text ?? '';
        if (node.type === 'hardBreak') return '\n';
        if (node.content?.length) return getNodeText(node.content);
        return '';
      })
      .join('');

  const renderTipTapNodes = (nodes: TipTapNode[], keyPrefix: string): React.ReactNode => {
    return nodes.map((node, index) => {
      const key = `${keyPrefix}-${node.type}-${index}`;

      if (node.type === 'heading') {
        const level = Number((node.attrs as { level?: number } | undefined)?.level ?? 2);
        const content = renderTipTapNodes(node.content ?? [], `${key}-content`);

        if (level === 3) {
          return (
            <h3 key={key} className="sans text-xl font-700 text-[#2E4210]">
              {content}
            </h3>
          );
        }

        if (level >= 4) {
          return (
            <h4 key={key} className="sans text-lg font-700 text-[#2E4210]">
              {content}
            </h4>
          );
        }

        return (
          <h2 key={key} className="sans text-2xl font-700 text-[#2E4210]">
            {content}
          </h2>
        );
      }

      if (node.type === 'paragraph') {
        return (
          <p key={key} className={`${textClassName} mb-4 last:mb-0`}>
            {renderTipTapNodes(node.content ?? [], `${key}-content`)}
          </p>
        );
      }

      if (node.type === 'bulletList') {
        return (
          <ul key={key} className={`${listClassName || 'list-disc pl-5'} mb-4 last:mb-0`}>
            {renderTipTapNodes(node.content ?? [], `${key}-content`)}
          </ul>
        );
      }

      if (node.type === 'orderedList') {
        return (
          <ol key={key} className={`${listClassName || 'list-decimal pl-5'} mb-4 last:mb-0`}>
            {renderTipTapNodes(node.content ?? [], `${key}-content`)}
          </ol>
        );
      }

      if (node.type === 'listItem') {
        return (
          <li key={key} className={listItemClassName || textClassName}>
            {renderTipTapNodes(node.content ?? [], `${key}-content`)}
          </li>
        );
      }

      if (node.type === 'hardBreak') {
        return <br key={key} />;
      }

      if (node.type === 'blockquote') {
        return (
          <blockquote key={key} className="mb-4 border-l-4 border-[#F0D542] pl-4 text-[#55692F] last:mb-0">
            {renderTipTapNodes(node.content ?? [], `${key}-content`)}
          </blockquote>
        );
      }

      if (node.type === 'codeBlock') {
        const codeText = getNodeText(node.content ?? []);
        return (
          <pre key={key} className="mb-4 overflow-x-auto rounded-lg bg-[#2E4210] p-4 text-sm text-[#F8F8F8] last:mb-0">
            <code>{codeText}</code>
          </pre>
        );
      }

      if (node.type === 'horizontalRule') {
        return <hr key={key} className="my-6 border-[#F8F8F8]" />;
      }

      if (node.type === 'text') {
        const text = node.text ?? '';
        return <span key={key}>{applyMarks(text, node.marks, key)}</span>;
      }

      if (node.content?.length) {
        return <span key={key}>{renderTipTapNodes(node.content, `${key}-content`)}</span>;
      }

      return null;
    });
  };

  return <div className={wrapperClassName}>{renderTipTapNodes(content.content ?? [], 'tiptap-root')}</div>;
}
