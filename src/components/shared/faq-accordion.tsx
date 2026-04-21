type FaqAccordionItem = {
  id?: string;
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqAccordionItem[];
  title?: string;
  emptyMessage?: string;
};

export default function FaqAccordion({ items, title, emptyMessage = 'No FAQ entries are available yet.' }: FaqAccordionProps) {
  return (
    <div className="container mx-auto p-4 py-12">
      {title ? <h2 className="mb-8 text-center text-3xl font-bold text-[#0a72b2]">{title}</h2> : null}
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, index) => (
            <details
              key={item.id || `${item.question}-${index}`}
              className="group rounded-lg border border-[#F8F8F8] bg-white shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg bg-[#F8F8F8] px-6 py-4 font-semibold text-[#0a72b2] transition-colors hover:bg-[#F0D542]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F0D542] [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span className="text-xl text-[#0a72b2] transition-transform duration-300 group-open:rotate-180" aria-hidden>
                  ▼
                </span>
              </summary>
              <div className="border-t border-[#F8F8F8] px-6 pb-4 pt-3 text-[#0a72b2]">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#F8F8F8] bg-white px-6 py-8 text-center text-sm text-[#0a72b2]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}