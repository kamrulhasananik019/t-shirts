'use client';

import { useState, type FormEvent } from 'react';

type ReviewSubmitFormProps = {
  onSubmitted: () => void;
};

const initialForm = {
  name: '',
  email: '',
  rating: 5,
  text: '',
};

export default function ReviewSubmitForm({ onSubmitted }: ReviewSubmitFormProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as { ok: boolean; error?: string; message?: string };
    if (!data.ok) {
      setError(data.error || 'Failed to submit review.');
      setSubmitting(false);
      return;
    }

    setSuccess(data.message || 'Review submitted successfully.');
    setForm(initialForm);
    onSubmitted();
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="mt-5 rounded-2xl border border-[#F8F8F8] bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold text-[#0a72b2]">Drop Review</h3>
      <p className="mt-1 text-sm text-[#0a72b2]">Use your Gmail. Review will be visible after admin approval.</p>

      {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-3 rounded-lg border border-[#F8F8F8] bg-[#F8F8F8] px-3 py-2 text-sm text-[#0a72b2]">{success}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          required
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Your name"
          className="w-full rounded-xl border border-[#F8F8F8] px-3 py-2 text-sm outline-none focus:border-[#F0D542]"
        />

        <input
          required
          type="email"
          pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="yourname@gmail.com"
          className="w-full rounded-xl border border-[#F8F8F8] px-3 py-2 text-sm outline-none focus:border-[#F0D542]"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#0a72b2]">Rating</label>
        <select
          value={form.rating}
          onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
          className="w-full rounded-xl border border-[#F8F8F8] px-3 py-2 text-sm outline-none focus:border-[#F0D542]"
        >
          <option value={5}>5</option>
          <option value={4}>4</option>
          <option value={3}>3</option>
          <option value={2}>2</option>
          <option value={1}>1</option>
        </select>
      </div>

      <textarea
        required
        rows={4}
        value={form.text}
        onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
        placeholder="Write your review"
        className="mt-3 w-full rounded-xl border border-[#F8F8F8] px-3 py-2 text-sm outline-none focus:border-[#F0D542]"
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-3 inline-flex items-center rounded-xl bg-[#0a72b2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#F0D542] disabled:opacity-60"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
