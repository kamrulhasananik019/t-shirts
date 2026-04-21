export type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipTapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
  content?: TipTapNode[];
};

export type TipTapDoc = {
  type: 'doc';
  content: TipTapNode[];
};

export type RichDescription = TipTapDoc;
