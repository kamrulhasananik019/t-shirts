'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { FilePenLine, MessageCircleQuestion, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export type AdminFaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FaqManagerProps = {
  faqs: AdminFaqItem[];
  searchTerm: string;
  onRefresh: () => Promise<void>;
  setError: (value: string) => void;
  setSuccess: (value: string) => void;
  setSaving: (value: boolean) => void;
};

type FaqFormState = {
  question: string;
  answer: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyFaqForm: FaqFormState = {
  question: '',
  answer: '',
  sortOrder: '1',
  isActive: true,
};

export default function FaqManager({ faqs, searchTerm, onRefresh, setError, setSuccess, setSaving }: FaqManagerProps) {
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [busyFaqId, setBusyFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState<FaqFormState>(emptyFaqForm);

  const filteredFaqs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter((item) => {
      return (
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term)
      );
    });
  }, [faqs, searchTerm]);

  const createOrUpdateFaq = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const endpoint = editingFaqId ? `/api/admin/faqs/${editingFaqId}` : '/api/admin/faqs';
    const method = editingFaqId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        question: faqForm.question,
        answer: faqForm.answer,
        sortOrder: Number(faqForm.sortOrder || 1),
        isActive: faqForm.isActive,
      }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setSaving(false);
      setError(data.error || 'Failed to save FAQ');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to save FAQ' });
      return;
    }

    setEditingFaqId(null);
    setFaqForm(emptyFaqForm);
    await onRefresh();
    setSaving(false);

    const message = editingFaqId ? 'FAQ updated.' : 'FAQ created.';
    setSuccess(message);
    await Swal.fire({ icon: 'success', title: 'Saved', text: message });
  };

  const removeFaq = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete FAQ?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#b91c1c',
    });

    if (!confirm.isConfirmed) return;

    setBusyFaqId(id);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/admin/faqs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setBusyFaqId(null);
      setError(data.error || 'Failed to delete FAQ');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to delete FAQ' });
      return;
    }

    await onRefresh();
    setBusyFaqId(null);
    setSuccess('FAQ deleted.');
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'FAQ deleted successfully.' });
  };

  const toggleFaq = async (item: AdminFaqItem) => {
    setBusyFaqId(item.id);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/admin/faqs/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        question: item.question,
        answer: item.answer,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
      }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setBusyFaqId(null);
      setError(data.error || 'Failed to update FAQ');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to update FAQ' });
      return;
    }

    await onRefresh();
    setBusyFaqId(null);
    setSuccess(item.isActive ? 'FAQ hidden from the public list.' : 'FAQ published.');
  };

  const startEditFaq = (item: AdminFaqItem) => {
    setEditingFaqId(item.id);
    setFaqForm({
      question: item.question,
      answer: item.answer,
      sortOrder: String(item.sortOrder || 1),
      isActive: item.isActive,
    });
  };

  const resetFaqEdit = () => {
    setEditingFaqId(null);
    setFaqForm(emptyFaqForm);
  };

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={createOrUpdateFaq} className="rounded-3xl border border-[#2E4210]/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2E4210]">{editingFaqId ? 'Update FAQ' : 'Create FAQ'}</h3>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#f8f8f8] px-2 py-1 text-xs text-[#f0d542]">
            <MessageCircleQuestion className="h-4 w-4" />
            FAQ CRUD
          </div>
        </div>

        <div className="space-y-3">
          <input
            required
            value={faqForm.question}
            onChange={(event) => setFaqForm((state) => ({ ...state, question: event.target.value }))}
            placeholder="Question"
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          />
          <textarea
            required
            rows={6}
            value={faqForm.answer}
            onChange={(event) => setFaqForm((state) => ({ ...state, answer: event.target.value }))}
            placeholder="Answer"
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min={1}
              value={faqForm.sortOrder}
              onChange={(event) => setFaqForm((state) => ({ ...state, sortOrder: event.target.value }))}
              placeholder="Sort order"
              className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
            />
            <label className="flex items-center gap-3 rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm text-[#f0d542]">
              <input
                type="checkbox"
                checked={faqForm.isActive}
                onChange={(event) => setFaqForm((state) => ({ ...state, isActive: event.target.checked }))}
                className="h-4 w-4 accent-[#2E4210]"
              />
              Visible on homepage
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2E4210] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f0d542]"
          >
            {editingFaqId ? <FilePenLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingFaqId ? 'Update FAQ' : 'Create FAQ'}
          </button>
          {editingFaqId ? (
            <button
              type="button"
              onClick={resetFaqEdit}
              className="rounded-xl border border-[#f8f8f8] px-4 py-2 text-sm font-medium text-[#f0d542]"
            >
              Cancel Edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f8f8f8] px-4 py-2 text-sm font-medium text-[#f0d542]"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-[#2E4210]/10 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-[#2E4210]">FAQ List ({filteredFaqs.length})</h3>
        <div className="space-y-3">
          {filteredFaqs.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#f8f8f8]/70 bg-[#f8f8f8]/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#2E4210]">{item.question}</p>
                  <p className="mt-1 text-xs text-[#55692F]">Order: {item.sortOrder}</p>
                  <p className="mt-1 text-xs text-[#f0d542]">Status: {item.isActive ? 'Active' : 'Hidden'}</p>
                  <p className="mt-2 text-xs text-[#55692F]">{item.answer}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={busyFaqId === item.id}
                    onClick={() => startEditFaq(item)}
                    className="rounded-lg border border-[#f0d542]/30 p-2 text-[#f0d542] disabled:opacity-50"
                    aria-label={`Edit ${item.question}`}
                  >
                    <FilePenLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busyFaqId === item.id}
                    onClick={() => void toggleFaq(item)}
                    className="rounded-lg border border-amber-300 p-2 text-amber-700 disabled:opacity-50"
                    aria-label={`${item.isActive ? 'Hide' : 'Publish'} ${item.question}`}
                  >
                    {item.isActive ? 'Off' : 'On'}
                  </button>
                  <button
                    type="button"
                    disabled={busyFaqId === item.id}
                    onClick={() => void removeFaq(item.id)}
                    className="rounded-lg border border-red-300 p-2 text-red-700 disabled:opacity-50"
                    aria-label={`Delete ${item.question}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {busyFaqId === item.id ? <p className="mt-1 text-xs text-[#55692F]">Working...</p> : null}
            </article>
          ))}
          {!filteredFaqs.length ? <p className="text-sm text-[#55692F]">No FAQs match your search.</p> : null}
        </div>
      </section>
    </div>
  );
}