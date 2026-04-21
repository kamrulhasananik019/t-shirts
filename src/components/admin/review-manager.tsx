'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { BadgeCheck, FilePenLine, MessageSquare, Plus, Trash2, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export type AdminReviewItem = {
  id: string;
  name: string;
  email: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'declined' | 'deleted';
  source: 'public' | 'admin';
  created_at: string;
};

type ReviewManagerProps = {
  reviews: AdminReviewItem[];
  searchTerm: string;
  onRefresh: () => Promise<void>;
  setError: (value: string) => void;
  setSuccess: (value: string) => void;
  setSaving: (value: boolean) => void;
};

type ReviewFormState = {
  name: string;
  email: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'declined' | 'deleted';
};

const emptyReviewForm: ReviewFormState = {
  name: '',
  email: '',
  rating: 5,
  text: '',
  status: 'approved',
};

function isValidGmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

export default function ReviewManager({
  reviews,
  searchTerm,
  onRefresh,
  setError,
  setSuccess,
  setSaving,
}: ReviewManagerProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reviews;
    return reviews.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term)
      );
    });
  }, [reviews, searchTerm]);

  const pendingReviews = useMemo(
    () => filteredReviews.filter((item) => item.status === 'pending'),
    [filteredReviews]
  );
  const approvedReviews = useMemo(
    () => filteredReviews.filter((item) => item.status === 'approved'),
    [filteredReviews]
  );
  const declinedReviews = useMemo(
    () => filteredReviews.filter((item) => item.status === 'declined'),
    [filteredReviews]
  );

  const visibleReviews = useMemo(() => {
    if (activeTab === 'pending') return pendingReviews;
    if (activeTab === 'approved') return approvedReviews;
    if (activeTab === 'declined') return declinedReviews;
    return filteredReviews;
  }, [activeTab, approvedReviews, declinedReviews, filteredReviews, pendingReviews]);

  const activeTabLabel =
    activeTab === 'all'
      ? 'All Reviews'
      : activeTab === 'pending'
        ? 'Pending Reviews'
        : activeTab === 'approved'
          ? 'Approved Reviews'
          : 'Declined Reviews';

  const reviewTabs = [
    { key: 'all' as const, label: `All Review: ${filteredReviews.length}`, tone: 'border-[#f8f8f8] bg-white text-[#f0d542]' },
    { key: 'pending' as const, label: `Pending: ${pendingReviews.length}`, tone: 'border-amber-200 bg-amber-50 text-amber-800' },
    { key: 'approved' as const, label: `Approved: ${approvedReviews.length}`, tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    { key: 'declined' as const, label: `Declined: ${declinedReviews.length}`, tone: 'border-rose-200 bg-rose-50 text-rose-800' },
  ];

  const createOrUpdateReview = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidGmail(reviewForm.email)) {
      setError('Only Gmail addresses are allowed.');
      await Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please use a Gmail address.' });
      return;
    }

    setSaving(true);
    const endpoint = editingReviewId ? `/api/admin/reviews/${editingReviewId}` : '/api/admin/reviews';
    const method = editingReviewId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(reviewForm),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setSaving(false);
      setError(data.error || 'Failed to save review');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to save review' });
      return;
    }

    setEditingReviewId(null);
    setReviewForm(emptyReviewForm);
    await onRefresh();
    setSaving(false);

    const message = editingReviewId ? 'Review updated.' : 'Review created.';
    setSuccess(message);
    await Swal.fire({ icon: 'success', title: 'Saved', text: message });
  };

  const removeReview = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete review?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#b91c1c',
    });

    if (!confirm.isConfirmed) return;

    setBusyReviewId(id);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
    });
    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      setError(data.error || 'Failed to delete review');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to delete review' });
      setBusyReviewId(null);
      return;
    }

    await onRefresh();
    setBusyReviewId(null);
    setSuccess('Review deleted.');
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Review deleted successfully.' });
  };

  const updateStatus = async (id: string, status: 'pending' | 'approved' | 'declined' | 'deleted') => {
    setBusyReviewId(id);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({ action: 'status-only', status }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setError(data.error || 'Failed to update review status');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to update review status' });
      setBusyReviewId(null);
      return;
    }

    await onRefresh();
    setBusyReviewId(null);
    setSuccess(`Review marked as ${status}.`);
    await Swal.fire({ icon: 'success', title: 'Updated', text: `Review marked as ${status}.` });
  };

  const startEditReview = (item: AdminReviewItem) => {
    setEditingReviewId(item.id);
    setReviewForm({
      name: item.name,
      email: item.email,
      rating: item.rating,
      text: item.text,
      status: item.status,
    });
  };

  const resetReviewEdit = () => {
    setEditingReviewId(null);
    setReviewForm(emptyReviewForm);
  };

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={createOrUpdateReview} className="rounded-3xl border border-[#2E4210]/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2E4210]">{editingReviewId ? 'Update Review' : 'Create Review'}</h3>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#f8f8f8] px-2 py-1 text-xs text-[#f0d542]">
            <MessageSquare className="h-4 w-4" />
            Review CRUD
          </div>
        </div>

        <div className="space-y-3">
          <input
            required
            value={reviewForm.name}
            onChange={(event) => setReviewForm((state) => ({ ...state, name: event.target.value }))}
            placeholder="Reviewer name"
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          />
          <input
            required
            type="email"
            value={reviewForm.email}
            onChange={(event) => setReviewForm((state) => ({ ...state, email: event.target.value }))}
            placeholder="reviewer@gmail.com"
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          />
          <select
            value={reviewForm.rating}
            onChange={(event) => setReviewForm((state) => ({ ...state, rating: Number(event.target.value) }))}
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          >
            <option value={5}>5</option>
            <option value={4}>4</option>
            <option value={3}>3</option>
            <option value={2}>2</option>
            <option value={1}>1</option>
          </select>
          <select
            value={reviewForm.status}
            onChange={(event) => setReviewForm((state) => ({ ...state, status: event.target.value as 'pending' | 'approved' | 'declined' }))}
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
          <textarea
            rows={5}
            required
            value={reviewForm.text}
            onChange={(event) => setReviewForm((state) => ({ ...state, text: event.target.value }))}
            placeholder="Review text"
            className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2E4210] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f0d542]"
          >
            {editingReviewId ? <FilePenLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingReviewId ? 'Update Review' : 'Create Review'}
          </button>
          {editingReviewId ? (
            <button
              type="button"
              onClick={resetReviewEdit}
              className="rounded-xl border border-[#f8f8f8] px-4 py-2 text-sm font-medium text-[#f0d542]"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <section className="rounded-3xl border border-[#2E4210]/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#2E4210]">Review Sections</h3>
            <p className="text-sm text-[#55692F]">Click a tab to show only that review group.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {reviewTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${tab.tone} ${isActive ? 'ring-2 ring-[#2E4210]/15' : 'opacity-80 hover:opacity-100'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[#f8f8f8]/70 bg-[#f8f8f8]/35 p-3">
          <h4 className="text-sm font-semibold text-[#2E4210]">{activeTabLabel} ({visibleReviews.length})</h4>
        </div>

        {visibleReviews.length > 0 ? (
          <div className="space-y-3">
            {visibleReviews.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#f8f8f8]/70 bg-[#f8f8f8]/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#2E4210]">{item.name}</p>
                    <p className="text-xs text-[#55692F]">{item.email}</p>
                    <p className="mt-1 text-xs text-[#f0d542]">Rating: {item.rating}/5</p>
                    <p className="mt-1 text-xs text-[#f0d542]">Status: {item.status}</p>
                    <p className="mt-1 text-xs text-[#f0d542]">Source: {item.source}</p>
                    <p className="mt-2 text-xs text-[#55692F]">{item.text}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={busyReviewId === item.id}
                      onClick={() => startEditReview(item)}
                      className="rounded-lg border border-[#f0d542]/30 p-2 text-[#f0d542] disabled:opacity-50"
                      aria-label={`Edit ${item.name}`}
                    >
                      <FilePenLine className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyReviewId === item.id}
                      onClick={() => void updateStatus(item.id, 'approved')}
                      className="rounded-lg border border-emerald-300 p-2 text-emerald-700 disabled:opacity-50"
                      aria-label={`Approve ${item.name}`}
                    >
                      <BadgeCheck className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyReviewId === item.id}
                      onClick={() => void updateStatus(item.id, 'declined')}
                      className="rounded-lg border border-amber-300 p-2 text-amber-700 disabled:opacity-50"
                      aria-label={`Decline ${item.name}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyReviewId === item.id}
                      onClick={() => void removeReview(item.id)}
                      className="rounded-lg border border-red-300 p-2 text-red-700 disabled:opacity-50"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {busyReviewId === item.id ? <p className="mt-1 text-xs text-[#55692F]">Working...</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#55692F]">No reviews in this section.</p>
        )}

        {!filteredReviews.length ? <p className="mt-4 text-sm text-[#55692F]">No reviews match your search.</p> : null}
      </section>
    </div>
  );
}
