'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      const sessionCheck = await fetch('/api/admin/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!sessionCheck.ok) {
        setError('Session did not initialize. Please try again.');
        return;
      }

      router.replace('/admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <h2 className="text-3xl font-black text-stone-900">Admin Login</h2>
      <form onSubmit={handleLogin} className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={submitting} className="w-full rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-white">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
