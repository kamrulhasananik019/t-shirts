'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  FilePenLine,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';

import RichEditorField from '@/components/admin/rich-editor-field';
import FaqManager, { type AdminFaqItem } from '@/components/admin/faq-manager';
import ReviewManager, { type AdminReviewItem } from '@/components/admin/review-manager';

type Category = {
  id: string;
  name: string;
  short_description?: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_image?: string;
};

type Product = {
  id: string;
  name: string;
  image_url: string;
  description: string;
  short_description: string;
  badges: string;
  category_id: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_image?: string;
};

type Props = {
  adminEmail: string;
};

type SectionKey = 'overview' | 'categories' | 'products' | 'reviews' | 'faqs';

type DashboardResponse = {
  ok: boolean;
  categories?: Category[];
  products?: Product[];
  reviews?: AdminReviewItem[];
  faqs?: AdminFaqItem[];
  error?: string;
};

const emptyCategoryForm = {
  name: '',
  imageUrl: '',
  parentId: '',
  shortDescription: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  seoImage: '',
};

const emptyProductForm = {
  name: '',
  imageUrls: '',
  badges: '',
  categoryIds: [] as string[],
  description: '',
  shortDescription: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  seoImage: '',
};

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function parseSeoKeywords(raw: string | undefined): string {
  if (!raw) return '';
  const parsed = parseJsonArray(raw);
  if (parsed.length > 0) return parsed.join(', ');
  return raw;
}

function getTextFromTiptapJson(raw: string): string {
  const compactText = (value: string): string => (value.length > 120 ? `${value.slice(0, 117)}...` : value);

  const fromDoc = (value: unknown): string => {
    if (!value || typeof value !== 'object') return '';
    const doc = value as { content?: unknown };
    if (!Array.isArray(doc.content)) return '';
    const text = JSON.stringify(doc.content)
      .replace(/[{}\[\]"]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return compactText(text);
  };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string') {
      try {
        const nested = JSON.parse(parsed) as unknown;
        return fromDoc(nested) || compactText(parsed);
      } catch {
        return compactText(parsed);
      }
    }

    return fromDoc(parsed) || compactText(raw);
  } catch {
    return compactText(raw);
  }
}

export default function AdminDashboard({ adminEmail }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });
      return (await response.json()) as DashboardResponse;
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const categories = useMemo(() => dashboardQuery.data?.categories || [], [dashboardQuery.data?.categories]);
  const products = useMemo(() => dashboardQuery.data?.products || [], [dashboardQuery.data?.products]);
  const reviews = useMemo(() => dashboardQuery.data?.reviews || [], [dashboardQuery.data?.reviews]);
  const faqs = useMemo(() => dashboardQuery.data?.faqs || [], [dashboardQuery.data?.faqs]);
  const isLoading = dashboardQuery.isLoading || dashboardQuery.isFetching;
  const queryError = dashboardQuery.data && !dashboardQuery.data.ok ? dashboardQuery.data.error || 'Failed to load data.' : '';

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item.name]));
  }, [categories]);

  const categoryOptions = useMemo(() => {
    return categories.map((item) => ({ id: item.id, name: item.name }));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((item) => {
      return item.name.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
    });
  }, [categories, searchTerm]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((item) => {
      return item.name.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
    });
  }, [products, searchTerm]);

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reviews;
    return reviews.filter((item) => {
      return item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
    });
  }, [reviews, searchTerm]);

  const filteredFaqs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter((item) => {
      return item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
    });
  }, [faqs, searchTerm]);

  const createCategory = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const endpoint = editingCategoryId ? `/api/admin/categories/${editingCategoryId}` : '/api/admin/categories';
    const method = editingCategoryId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        name: categoryForm.name,
        imageUrl: categoryForm.imageUrl,
        parentId: categoryForm.parentId || null,
        shortDescription: categoryForm.shortDescription,
        description: categoryForm.description,
        seo: {
          title: categoryForm.seoTitle,
          description: categoryForm.seoDescription,
          keywords: categoryForm.seoKeywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          image: categoryForm.seoImage,
        },
      }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setError(data.error || 'Failed to save category');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to save category' });
      setSaving(false);
      return;
    }

    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    await refresh();

    setSaving(false);
    setSuccess(editingCategoryId ? 'Category updated.' : 'Category created.');
    await Swal.fire({ icon: 'success', title: 'Saved', text: editingCategoryId ? 'Category updated successfully.' : 'Category created successfully.' });
  };

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const endpoint = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
    const method = editingProductId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        name: productForm.name,
        imageUrls: productForm.imageUrls
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        badges: productForm.badges
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        categoryIds: productForm.categoryIds,
        description: productForm.description,
        shortDescription: productForm.shortDescription,
        seo: {
          title: productForm.seoTitle,
          description: productForm.seoDescription,
          keywords: productForm.seoKeywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          image: productForm.seoImage,
        },
      }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setError(data.error || 'Failed to save product');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to save product' });
      setSaving(false);
      return;
    }

    setEditingProductId(null);
    setProductForm(emptyProductForm);
    await refresh();

    setSaving(false);
    setSuccess(editingProductId ? 'Product updated.' : 'Product created.');
    await Swal.fire({ icon: 'success', title: 'Saved', text: editingProductId ? 'Product updated successfully.' : 'Product created successfully.' });
  };

  const removeCategory = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete category?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#b91c1c',
    });

    if (!confirm.isConfirmed) return;

    setBusyCategoryId(id);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', credentials: 'include', cache: 'no-store' });
    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      setError(data.error || 'Failed to delete category');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to delete category' });
      setBusyCategoryId(null);
      return;
    }

    await refresh();
    setSuccess('Category deleted.');
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Category deleted successfully.' });
    setBusyCategoryId(null);
  };

  const removeProduct = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete product?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#b91c1c',
    });

    if (!confirm.isConfirmed) return;

    setBusyProductId(id);
    setError('');
    setSuccess('');

    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include', cache: 'no-store' });
    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      setError(data.error || 'Failed to delete product');
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to delete product' });
      setBusyProductId(null);
      return;
    }

    await refresh();
    setSuccess('Product deleted.');
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Product deleted successfully.' });
    setBusyProductId(null);
  };

  const startEditCategory = (item: Category) => {
    setEditingCategoryId(item.id);
    setCategoryForm({
      name: item.name,
      imageUrl: item.image_url,
      parentId: item.parent_id || '',
      shortDescription: item.short_description || '',
      description: item.description,
      seoTitle: item.seo_title || '',
      seoDescription: item.seo_description || '',
      seoKeywords: parseSeoKeywords(item.seo_keywords),
      seoImage: item.seo_image || '',
    });
    setActiveSection('categories');
    setDrawerOpen(false);
  };

  const startEditProduct = (item: Product) => {
    const categoryIds = parseJsonArray(item.category_id);

    const imageUrls = parseJsonArray(item.image_url).join('\n');
    const badges = parseJsonArray(item.badges).join(', ');

    setEditingProductId(item.id);
    setProductForm({
      name: item.name,
      imageUrls,
      badges,
      categoryIds,
      description: item.description,
      shortDescription: item.short_description,
      seoTitle: item.seo_title || '',
      seoDescription: item.seo_description || '',
      seoKeywords: parseSeoKeywords(item.seo_keywords),
      seoImage: item.seo_image || '',
    });
    setActiveSection('products');
    setDrawerOpen(false);
  };

  const resetCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const resetProductEdit = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
    router.replace('/admin/login');
  };

  const menuItems = [
    { key: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'categories' as const, label: 'Category CRUD', icon: Boxes },
    { key: 'products' as const, label: 'Product CRUD', icon: Package },
    { key: 'reviews' as const, label: 'Review CRUD', icon: MessageSquare },
    { key: 'faqs' as const, label: 'FAQ CRUD', icon: MessageSquare },
  ];

  const kpiCards = [
    {
      title: 'Total Categories',
      value: categories.length,
      hint: 'Catalog structure',
      color: 'from-[var(--pp-800)] to-[var(--pp-700)]',
    },
    {
      title: 'Total Products',
      value: products.length,
      hint: 'Items published',
      color: 'from-[#0a72b2] to-[#0a72b2]',
    },
    {
      title: 'Total FAQs',
      value: faqs.length,
      hint: 'Help content',
      color: 'from-[#0a72b2] to-[#0a72b2]',
    },
    {
      title: 'Active Panel',
      value:
        activeSection === 'overview'
          ? 'Dashboard'
          : activeSection === 'categories'
            ? 'Categories'
            : activeSection === 'products'
              ? 'Products'
              : activeSection === 'reviews'
                ? 'Reviews'
                : 'FAQs',
      hint: 'Current workspace',
      color: 'from-[#0a72b2] to-[#0a72b2]',
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-(--pp-bg) pt-44 text-(--pp-text) md:pt-48 lg:pt-52">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(85,105,47,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(248,248,248,0.35),transparent_40%)]" />

      {(isLoading || saving) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a72b2]/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-xl border border-[#0a72b2]/20 bg-white px-5 py-3 text-sm font-semibold text-[#0a72b2] shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin" />
            {saving ? 'Saving changes...' : 'Loading admin data...'}
          </div>
        </div>
      )}

      <aside
        className={`fixed bottom-0 left-0 top-44 z-40 flex w-72 flex-col border-r border-[#0a72b2]/10 bg-white/95 p-4 shadow-xl backdrop-blur transition-transform duration-300  lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } ${drawerCollapsed ? 'lg:w-24' : ''}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className={`overflow-hidden transition-all ${drawerCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#0a72b2]">Same Day T-Shirt Printing London</p>
            <h1 className="text-xl font-bold text-[#0a72b2]">Admin Panel</h1>
          </div>
          <button
            type="button"
            onClick={() => setDrawerCollapsed((value) => !value)}
            className="hidden rounded-lg border border-[#f8f8f8] p-2 text-[#0a72b2] lg:inline-flex"
            aria-label="Toggle drawer width"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg border border-[#f8f8f8] p-2 text-[#0a72b2] lg:hidden"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveSection(item.key);
                  setDrawerOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  active
                    ? 'bg-[#0a72b2] text-white shadow-lg shadow-[#0a72b2]/20'
                    : 'text-[#f0d542] hover:bg-[#f8f8f8]'
                } ${drawerCollapsed ? 'lg:justify-center' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={`${drawerCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void refresh()}
            className={`flex w-full items-center gap-3 rounded-xl border border-[#f8f8f8] px-3 py-3 text-sm font-medium text-[#f0d542] transition hover:bg-[#f8f8f8] ${
              drawerCollapsed ? 'lg:justify-center' : ''
            }`}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className={`${drawerCollapsed ? 'lg:hidden' : ''}`}>Refresh Data</span>
          </button>
        </div>

        <div className="mt-auto rounded-2xl bg-linear-to-br from-[#0a72b2] to-[#0a72b2] p-4 text-white">
          <p className={`text-xs ${drawerCollapsed ? 'lg:hidden' : ''}`}>Signed in as</p>
          <p className={`mt-1 truncate text-sm font-semibold ${drawerCollapsed ? 'lg:hidden' : ''}`}>{adminEmail}</p>
          <button
            type="button"
            onClick={logout}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/25 ${
              drawerCollapsed ? 'lg:px-2' : ''
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span className={`${drawerCollapsed ? 'lg:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-44 z-30 bg-[#0a72b2]/20 md:top-48 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu overlay"
        />
      ) : null}

      <section className={`relative z-10 p-4 transition-all lg:p-8 ${drawerCollapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
        <header className="mb-6 rounded-3xl border border-[#0a72b2]/10 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-lg border border-[#f8f8f8] p-2 text-[#0a72b2] lg:hidden"
                aria-label="Open drawer"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#0a72b2]">Admin Workspace</p>
                <h2 className="text-2xl font-bold text-[#0a72b2]">Admin Dashboard</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#f8f8f8] bg-[#f8f8f8] px-3 py-2 text-sm text-[#f0d542]">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or id"
                className="w-52 bg-transparent outline-none placeholder:text-[#0a72b2]/70"
              />
            </div>
          </div>
        </header>

        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {queryError ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{queryError}</p> : null}
        {success ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <div className="grid gap-4 md:grid-cols-4">
          {kpiCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-2xl bg-linear-to-br ${card.color} p-4 text-white shadow-lg shadow-[#0a72b2]/10`}
            >
              <p className="text-sm text-white/80">{card.title}</p>
              <p className="mt-1 text-2xl font-black">{card.value}</p>
              <p className="mt-2 text-xs text-white/80">{card.hint}</p>
            </article>
          ))}
        </div>

        {activeSection === 'overview' ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0a72b2]">Recent Categories</h3>
                <button
                  type="button"
                  onClick={() => setActiveSection('categories')}
                  className="rounded-lg border border-[#f8f8f8] px-3 py-1.5 text-xs font-semibold text-[#f0d542]"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {filteredCategories.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#f8f8f8]/60 bg-[#f8f8f8]/50 px-3 py-2">
                    <p className="font-semibold text-[#0a72b2]">{item.name}</p>
                    <p className="text-xs text-[#0a72b2]">{item.id}</p>
                  </div>
                ))}
                {!filteredCategories.length ? <p className="text-sm text-[#0a72b2]">No categories yet.</p> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0a72b2]">Recent Products</h3>
                <button
                  type="button"
                  onClick={() => setActiveSection('products')}
                  className="rounded-lg border border-[#f8f8f8] px-3 py-1.5 text-xs font-semibold text-[#f0d542]"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {filteredProducts.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#f8f8f8]/60 bg-[#f8f8f8]/50 px-3 py-2">
                    <p className="font-semibold text-[#0a72b2]">{item.name}</p>
                    <p className="text-xs text-[#0a72b2]">{item.id}</p>
                  </div>
                ))}
                {!filteredProducts.length ? <p className="text-sm text-[#0a72b2]">No products yet.</p> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0a72b2]">Recent Reviews</h3>
                <button
                  type="button"
                  onClick={() => setActiveSection('reviews')}
                  className="rounded-lg border border-[#f8f8f8] px-3 py-1.5 text-xs font-semibold text-[#f0d542]"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {filteredReviews.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#f8f8f8]/60 bg-[#f8f8f8]/50 px-3 py-2">
                    <p className="font-semibold text-[#0a72b2]">{item.name}</p>
                    <p className="text-xs text-[#0a72b2]">{item.email}</p>
                    <p className="text-xs text-[#f0d542]">Status: {item.status}</p>
                  </div>
                ))}
                {!filteredReviews.length ? <p className="text-sm text-[#0a72b2]">No reviews yet.</p> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0a72b2]">Recent FAQs</h3>
                <button
                  type="button"
                  onClick={() => setActiveSection('faqs')}
                  className="rounded-lg border border-[#f8f8f8] px-3 py-1.5 text-xs font-semibold text-[#f0d542]"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {filteredFaqs.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#f8f8f8]/60 bg-[#f8f8f8]/50 px-3 py-2">
                    <p className="font-semibold text-[#0a72b2]">{item.question}</p>
                    <p className="text-xs text-[#0a72b2]">Order: {item.sortOrder}</p>
                    <p className="text-xs text-[#f0d542]">Status: {item.isActive ? 'Active' : 'Hidden'}</p>
                  </div>
                ))}
                {!filteredFaqs.length ? <p className="text-sm text-[#0a72b2]">No FAQs yet.</p> : null}
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === 'categories' ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={createCategory} className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0a72b2]">
                  {editingCategoryId ? 'Update Category' : 'Create Category'}
                </h3>
                <div className="inline-flex items-center gap-2 rounded-lg bg-[#f8f8f8] px-2 py-1 text-xs text-[#f0d542]">
                  <Boxes className="h-4 w-4" />
                  Category CRUD
                </div>
              </div>

              <div className="space-y-3">
                <input
                  required
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((state) => ({ ...state, name: event.target.value }))}
                  placeholder="Category name"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
                <input
                  required
                  value={categoryForm.imageUrl}
                  onChange={(event) => setCategoryForm((state) => ({ ...state, imageUrl: event.target.value }))}
                  placeholder="Category image URL"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
                <select
                  value={categoryForm.parentId}
                  onChange={(event) => setCategoryForm((state) => ({ ...state, parentId: event.target.value }))}
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                >
                  <option value="">No parent category</option>
                  {categoryOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <RichEditorField
                  label="Short Description"
                  value={categoryForm.shortDescription}
                  onChange={(value) => setCategoryForm((state) => ({ ...state, shortDescription: value }))}
                  minRows={6}
                />

                <RichEditorField
                  label="Description"
                  value={categoryForm.description}
                  onChange={(value) => setCategoryForm((state) => ({ ...state, description: value }))}
                  minRows={8}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={categoryForm.seoTitle}
                    onChange={(event) => setCategoryForm((state) => ({ ...state, seoTitle: event.target.value }))}
                    placeholder="SEO title"
                    className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                  />
                  <input
                    value={categoryForm.seoImage}
                    onChange={(event) => setCategoryForm((state) => ({ ...state, seoImage: event.target.value }))}
                    placeholder="SEO image URL"
                    className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                  />
                </div>
                <textarea
                  rows={3}
                  value={categoryForm.seoDescription}
                  onChange={(event) => setCategoryForm((state) => ({ ...state, seoDescription: event.target.value }))}
                  placeholder="SEO description"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
                <input
                  value={categoryForm.seoKeywords}
                  onChange={(event) => setCategoryForm((state) => ({ ...state, seoKeywords: event.target.value }))}
                  placeholder="SEO keywords (comma separated)"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0a72b2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f0d542]"
                >
                  {editingCategoryId ? <FilePenLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingCategoryId ? 'Update Category' : 'Create Category'}
                </button>
                {editingCategoryId ? (
                  <button
                    type="button"
                    onClick={resetCategoryEdit}
                    className="rounded-xl border border-[#f8f8f8] px-4 py-2 text-sm font-medium text-[#f0d542]"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <section className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-[#0a72b2]">Category List ({filteredCategories.length})</h3>
              <div className="space-y-3">
                {filteredCategories.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[#f8f8f8]/70 bg-[#f8f8f8]/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0a72b2]">{item.name}</p>
                        <p className="text-xs text-[#0a72b2]">{item.id}</p>
                        <p className="mt-1 text-xs text-[#f0d542]">
                          Parent: {item.parent_id ? categoryNameById.get(item.parent_id) || item.parent_id : 'None'}
                        </p>
                        <p className="mt-1 text-xs text-[#0a72b2]">{getTextFromTiptapJson(item.short_description || '') || 'No short description.'}</p>
                        <p className="mt-1 text-xs text-[#0a72b2]">{getTextFromTiptapJson(item.description) || 'No description.'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busyCategoryId === item.id}
                          onClick={() => startEditCategory(item)}
                          className="rounded-lg border border-[#f0d542]/30 p-2 text-[#f0d542] disabled:opacity-50"
                          aria-label={`Edit ${item.name}`}
                        >
                          <FilePenLine className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busyCategoryId === item.id}
                          onClick={() => void removeCategory(item.id)}
                          className="rounded-lg border border-red-300 p-2 text-red-700 disabled:opacity-50"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {busyCategoryId === item.id ? <p className="mt-1 text-xs text-[#0a72b2]">Working...</p> : null}
                  </article>
                ))}
                {!filteredCategories.length ? <p className="text-sm text-[#0a72b2]">No categories match your search.</p> : null}
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === 'products' ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={createProduct} className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0a72b2]">
                  {editingProductId ? 'Update Product' : 'Create Product'}
                </h3>
                <div className="inline-flex items-center gap-2 rounded-lg bg-[#f8f8f8] px-2 py-1 text-xs text-[#f0d542]">
                  <Package className="h-4 w-4" />
                  Product CRUD
                </div>
              </div>

              <div className="space-y-3">
                <input
                  required
                  value={productForm.name}
                  onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))}
                  placeholder="Product name"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
                <input
                  value={productForm.badges}
                  onChange={(event) => setProductForm((state) => ({ ...state, badges: event.target.value }))}
                  placeholder="Badges (comma separated)"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
                <div className="space-y-2 rounded-xl border border-[#f8f8f8] p-3">
                  <p className="text-xs font-semibold text-[#0a72b2]">Select Categories:</p>
                  <div className="space-y-2">
                    {categoryOptions.length > 0 ? (
                      categoryOptions.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...productForm.categoryIds, category.id]
                                : productForm.categoryIds.filter((id) => id !== category.id);
                              setProductForm((state) => ({ ...state, categoryIds: newIds }));
                            }}
                            className="rounded cursor-pointer"
                          />
                          <span className="text-sm text-[#f0d542]">{category.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-[#0a72b2]">No categories available</p>
                    )}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={productForm.imageUrls}
                  onChange={(event) => setProductForm((state) => ({ ...state, imageUrls: event.target.value }))}
                  placeholder="Image URLs (one per line)"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />

                <RichEditorField
                  label="Short Description"
                  value={productForm.shortDescription}
                  onChange={(value) => setProductForm((state) => ({ ...state, shortDescription: value }))}
                  minRows={6}
                />
                <RichEditorField
                  label="Description"
                  value={productForm.description}
                  onChange={(value) => setProductForm((state) => ({ ...state, description: value }))}
                  minRows={8}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={productForm.seoTitle}
                    onChange={(event) => setProductForm((state) => ({ ...state, seoTitle: event.target.value }))}
                    placeholder="SEO title"
                    className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                  />
                  <input
                    value={productForm.seoImage}
                    onChange={(event) => setProductForm((state) => ({ ...state, seoImage: event.target.value }))}
                    placeholder="SEO image URL"
                    className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                  />
                </div>
                <textarea
                  rows={3}
                  value={productForm.seoDescription}
                  onChange={(event) => setProductForm((state) => ({ ...state, seoDescription: event.target.value }))}
                  placeholder="SEO description"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
                <input
                  value={productForm.seoKeywords}
                  onChange={(event) => setProductForm((state) => ({ ...state, seoKeywords: event.target.value }))}
                  placeholder="SEO keywords (comma separated)"
                  className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0a72b2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f0d542]"
                >
                  {editingProductId ? <FilePenLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingProductId ? 'Update Product' : 'Create Product'}
                </button>
                {editingProductId ? (
                  <button
                    type="button"
                    onClick={resetProductEdit}
                    className="rounded-xl border border-[#f8f8f8] px-4 py-2 text-sm font-medium text-[#f0d542]"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <section className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-[#0a72b2]">Product List ({filteredProducts.length})</h3>
              <div className="space-y-3">
                {filteredProducts.map((item) => {
                  const categoryNames = parseJsonArray(item.category_id)
                    .map((id) => categoryNameById.get(id) || id)
                    .join(', ');
                  const badges = parseJsonArray(item.badges).join(', ');

                  return (
                    <article key={item.id} className="rounded-2xl border border-[#f8f8f8]/70 bg-[#f8f8f8]/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0a72b2]">{item.name}</p>
                          <p className="text-xs text-[#0a72b2]">{item.id}</p>
                          <p className="mt-1 text-xs text-[#f0d542]">Categories: {categoryNames || 'None'}</p>
                          <p className="mt-1 text-xs text-[#f0d542]">Badges: {badges || 'None'}</p>
                          <p className="mt-1 text-xs text-[#0a72b2]">{getTextFromTiptapJson(item.short_description) || 'No short description.'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={busyProductId === item.id}
                            onClick={() => startEditProduct(item)}
                            className="rounded-lg border border-[#f0d542]/30 p-2 text-[#f0d542] disabled:opacity-50"
                            aria-label={`Edit ${item.name}`}
                          >
                            <FilePenLine className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busyProductId === item.id}
                            onClick={() => void removeProduct(item.id)}
                            className="rounded-lg border border-red-300 p-2 text-red-700 disabled:opacity-50"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {busyProductId === item.id ? <p className="mt-1 text-xs text-[#0a72b2]">Working...</p> : null}
                    </article>
                  );
                })}
                {!filteredProducts.length ? <p className="text-sm text-[#0a72b2]">No products match your search.</p> : null}
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === 'reviews' ? (
          <ReviewManager
            reviews={reviews}
            searchTerm={searchTerm}
            onRefresh={refresh}
            setError={setError}
            setSuccess={setSuccess}
            setSaving={setSaving}
          />
        ) : null}

        {activeSection === 'faqs' ? (
          <FaqManager
            faqs={faqs}
            searchTerm={searchTerm}
            onRefresh={refresh}
            setError={setError}
            setSuccess={setSuccess}
            setSaving={setSaving}
          />
        ) : null}
      </section>
    </main>
  );
}
