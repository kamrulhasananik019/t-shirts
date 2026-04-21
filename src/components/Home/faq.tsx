import FaqAccordion from '@/components/shared/faq-accordion';
import { getFaqs } from '@/services/faq.service';

export default async function Faq() {
  const faqs = await getFaqs(12);

  return (
    <FaqAccordion
      title="Frequently Asked Questions"
      items={faqs.map((item) => ({ id: item.id, question: item.question, answer: item.answer }))}
      emptyMessage="No FAQ entries have been published yet."
    />
  );
}
