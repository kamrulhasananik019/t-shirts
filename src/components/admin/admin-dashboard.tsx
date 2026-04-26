'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
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
import { getSafeImageSrc } from '@/lib/image-url';

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

function formatUploadErrorMessage(status: number | null, fallbackMessage: string): string {
  if (status === 401) return 'Upload failed: you are not signed in as an admin.';
  if (status === 403) return 'Upload failed: Cloudflare R2 rejected the request. Check the R2 access key and bucket permissions.';
  if (status === 411) return 'Upload failed: R2 requires a valid content length. Please retry the upload.';
  if (status === 413) return 'Upload failed: the image is too large.';
  if (status && status >= 500) return 'Upload failed: the storage service returned an error.';
  return fallbackMessage;
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
  const uploadToast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const categoryDraftUploadUrlsRef = useRef<Set<string>>(new Set());
  const productDraftUploadUrlsRef = useRef<Set<string>>(new Set());

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

  const productImageUrls = useMemo(
    () =>
      productForm.imageUrls
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [productForm.imageUrls]
  );

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

  const normalizeMediaUrl = (url: string): string => {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url.trim();
    }
  };

  const isManagedMediaUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.pathname.startsWith('/api/media/');
    } catch {
      return false;
    }
  };

  const trackCategoryDraftUpload = (url: string) => {
    if (!isManagedMediaUrl(url)) return;
    categoryDraftUploadUrlsRef.current.add(normalizeMediaUrl(url));
  };

  const untrackCategoryDraftUpload = (url: string) => {
    categoryDraftUploadUrlsRef.current.delete(normalizeMediaUrl(url));
  };

  const trackProductDraftUpload = (url: string) => {
    if (!isManagedMediaUrl(url)) return;
    productDraftUploadUrlsRef.current.add(normalizeMediaUrl(url));
  };

  const untrackProductDraftUpload = (url: string) => {
    productDraftUploadUrlsRef.current.delete(normalizeMediaUrl(url));
  };

  const collectTrackedDraftUploadUrls = (): string[] => {
    return Array.from(new Set([...categoryDraftUploadUrlsRef.current, ...productDraftUploadUrlsRef.current]));
  };

  const removeTrackedDraftUploadUrls = (urls: string[]) => {
    for (const url of urls) {
      untrackCategoryDraftUpload(url);
      untrackProductDraftUpload(url);
    }
  };

  const requestDraftCleanup = async (urls: string[], options?: { keepalive?: boolean }) => {
    const response = await fetch('/api/admin/media/cleanup', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      keepalive: options?.keepalive,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({ ok: false, error: 'Failed to cleanup draft media' }))) as {
        ok?: boolean;
        error?: string;
      };
      throw new Error(data.error || 'Failed to cleanup draft media');
    }
  };

  const cleanupTrackedDraftUploads = async (urls: string[], options?: { keepalive?: boolean }) => {
    if (urls.length === 0) return;
    try {
      await requestDraftCleanup(urls, options);
      removeTrackedDraftUploadUrls(urls);
    } catch (cleanupError) {
      console.error('Failed to cleanup draft uploads', cleanupError);
    }
  };

  const cleanupTrackedDraftUploadsWithBeacon = () => {
    const urls = collectTrackedDraftUploadUrls();
    if (urls.length === 0) return;

    const payload = JSON.stringify({ urls });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon('/api/admin/media/cleanup', new Blob([payload], { type: 'application/json' }));
      if (sent) {
        removeTrackedDraftUploadUrls(urls);
        return;
      }
    }

    void cleanupTrackedDraftUploads(urls, { keepalive: true });
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupTrackedDraftUploadsWithBeacon();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanupTrackedDraftUploadsWithBeacon();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void cleanupTrackedDraftUploads(collectTrackedDraftUploadUrls());
    };
  }, []);

  const uploadMedia = async (file: File, kind: 'categories' | 'products' | 'seo' | 'shared', title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    if (title && title.trim()) {
      formData.append('title', title.trim());
    }

    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        body: formData,
      });

      const rawText = await response.text();
      const data = rawText ? (JSON.parse(rawText) as { ok?: boolean; url?: string; error?: string }) : null;

      if (!response.ok || !data?.ok || !data?.url) {
        const fallbackMessage = data?.error || response.statusText || 'Failed to upload image';
        throw new Error(formatUploadErrorMessage(response.status, fallbackMessage));
      }

      return data.url;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Upload failed: unexpected response from the upload service.');
      }

      if (error instanceof TypeError && error.message === 'fetch failed') {
        throw new Error('Upload failed: unable to reach the upload service.');
      }

      throw error;
    }
  };

  const deleteMedia = async (url: string) => {
    const normalizedUrl = normalizeMediaUrl(url);
    const response = await fetch('/api/admin/media', {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalizedUrl }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      throw new Error(data.error || 'Failed to delete image');
    }
  };

  const handleCategoryImageUpload = async (file: File | null) => {
    if (!file) return;

    setError('');
    setSuccess('');
    setUploadingCategoryImage(true);
    void uploadToast.fire({ icon: 'info', title: 'Uploading category image...' });

    try {
      const previousUrl = categoryForm.imageUrl;
      const url = await uploadMedia(file, 'categories', categoryForm.name);

      if (previousUrl && previousUrl !== url && isManagedMediaUrl(previousUrl)) {
        try {
          await deleteMedia(previousUrl);
          untrackCategoryDraftUpload(previousUrl);
        } catch (cleanupError) {
          console.error('Failed to cleanup previous draft category image', cleanupError);
        }
      }

      trackCategoryDraftUpload(url);
      setCategoryForm((state) => ({ ...state, imageUrl: url }));
      setSuccess('Category image uploaded.');
      void uploadToast.fire({ icon: 'success', title: 'Category image uploaded' });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Failed to upload category image';
      setError(message);
      void uploadToast.fire({ icon: 'error', title: message });
      await Swal.fire({ icon: 'error', title: 'Upload failed', text: message });
    } finally {
      setUploadingCategoryImage(false);
    }
  };

  const handleProductImagesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    setSuccess('');
    setUploadingProductImages(true);
    void uploadToast.fire({ icon: 'info', title: `Uploading ${files.length} product image${files.length === 1 ? '' : 's'}...` });

    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadMedia(file, 'products', productForm.name);
        trackProductDraftUpload(url);
        urls.push(url);
      }

      setProductForm((state) => ({
        ...state,
        imageUrls: [state.imageUrls.trim(), ...urls].filter(Boolean).join('\n'),
      }));
      setSuccess(urls.length === 1 ? 'Product image uploaded.' : `${urls.length} product images uploaded.`);
      void uploadToast.fire({ icon: 'success', title: urls.length === 1 ? 'Product image uploaded' : `${urls.length} product images uploaded` });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Failed to upload product images';
      setError(message);
      void uploadToast.fire({ icon: 'error', title: message });
      await Swal.fire({ icon: 'error', title: 'Upload failed', text: message });
    } finally {
      setUploadingProductImages(false);
    }
  };

  const removeProductImage = async (url: string) => {
    const isManagedMedia = isManagedMediaUrl(url);

    if (isManagedMedia) {
      setUploadingProductImages(true);
      try {
        await deleteMedia(url);
        untrackProductDraftUpload(url);
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete image';
        setError(message);
        await Swal.fire({ icon: 'error', title: 'Delete failed', text: message });
        return;
      } finally {
        setUploadingProductImages(false);
      }
    }

    setProductForm((state) => ({
      ...state,
      imageUrls: state.imageUrls
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item && item !== url)
        .join('\n'),
    }));
  };

  const removeCategoryImage = async () => {
    if (!categoryForm.imageUrl) return;

    const url = categoryForm.imageUrl;
    if (isManagedMediaUrl(url)) {
      setUploadingCategoryImage(true);
      try {
        await deleteMedia(url);
        untrackCategoryDraftUpload(url);
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete image';
        setError(message);
        await Swal.fire({ icon: 'error', title: 'Delete failed', text: message });
        return;
      } finally {
        setUploadingCategoryImage(false);
      }
    }

    setCategoryForm((state) => ({ ...state, imageUrl: '' }));
  };

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

    categoryDraftUploadUrlsRef.current.clear();
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

    productDraftUploadUrlsRef.current.clear();
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
    const urls = Array.from(categoryDraftUploadUrlsRef.current);
    void cleanupTrackedDraftUploads(urls);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const resetProductEdit = () => {
    const urls = Array.from(productDraftUploadUrlsRef.current);
    void cleanupTrackedDraftUploads(urls);
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
    <main className="relative min-h-screen overflow-x-hidden bg-(--pp-bg) pt-44 text-(--pp-text) md:pt-48 lg:pt-52">
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
          <>
            <div className="sticky top-44 z-30 mt-6 mb-4 flex flex-wrap gap-2 rounded-2xl border border-[#f8f8f8] bg-white/95 p-3 shadow-sm backdrop-blur md:top-48 lg:top-52">
              <button
                type="submit"
                form="admin-category-form"
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

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <form id="admin-category-form" onSubmit={createCategory} className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
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
                <div className="space-y-3 rounded-xl border border-[#f8f8f8] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#0a72b2]">Category image</p>
                    <span className="text-[11px] text-[#0a72b2]">Upload from device or paste a URL</span>
                  </div>
                  {getSafeImageSrc(categoryForm.imageUrl) ? (
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-[#f8f8f8] bg-[#f8f8f8]">
                      <Image
                        src={getSafeImageSrc(categoryForm.imageUrl)!}
                        alt={categoryForm.name || 'Category image'}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#f8f8f8] px-3 py-8 text-center text-xs text-[#0a72b2]">
                      No category image selected yet.
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleCategoryImageUpload(event.target.files?.[0] ?? null)}
                      className="block w-full max-w-xs text-sm text-[#0a72b2] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0a72b2] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#f0d542] disabled:opacity-60"
                      disabled={uploadingCategoryImage || saving}
                    />
                    {categoryForm.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => void removeCategoryImage()}
                        className="rounded-xl border border-[#f8f8f8] px-3 py-2 text-xs font-medium text-[#f0d542]"
                        disabled={uploadingCategoryImage || saving}
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                  <input
                    required
                    value={categoryForm.imageUrl}
                    onChange={(event) => setCategoryForm((state) => ({ ...state, imageUrl: event.target.value }))}
                    placeholder="Category image URL"
                    className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                  />
                </div>
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
          </>
        ) : null}

        {activeSection === 'products' ? (
          <>
            <div className="sticky top-44 z-30 mt-6 mb-4 flex flex-wrap gap-2 rounded-2xl border border-[#f8f8f8] bg-white/95 p-3 shadow-sm backdrop-blur md:top-48 lg:top-52">
              <button
                type="submit"
                form="admin-product-form"
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

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <form id="admin-product-form" onSubmit={createProduct} className="rounded-3xl border border-[#0a72b2]/10 bg-white p-5 shadow-sm">
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
                <div className="space-y-3 rounded-xl border border-[#f8f8f8] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#0a72b2]">Product images</p>
                    <span className="text-[11px] text-[#0a72b2]">Upload one or more files, or paste URLs</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => void handleProductImagesUpload(event.target.files)}
                    className="block w-full text-sm text-[#0a72b2] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0a72b2] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#f0d542] disabled:opacity-60"
                    disabled={uploadingProductImages || saving}
                  />
                  {productImageUrls.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {productImageUrls.map((url, index) => {
                        const imageSrc = getSafeImageSrc(url);
                        return (
                          <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border border-[#f8f8f8] bg-white">
                            <div className="relative aspect-square bg-[#f8f8f8]">
                              {imageSrc ? (
                                <Image src={imageSrc} alt={`${productForm.name || 'Product'} image ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 20vw" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-[#0a72b2]">No preview</div>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[#0a72b2]">
                              <span className="truncate">Image {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => void removeProductImage(url)}
                                className="rounded-lg border border-[#f8f8f8] px-2 py-1 font-medium text-[#f0d542]"
                                disabled={uploadingProductImages || saving}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#f8f8f8] px-3 py-8 text-center text-xs text-[#0a72b2]">
                      No product images selected yet.
                    </div>
                  )}
                  <textarea
                    rows={4}
                    value={productForm.imageUrls}
                    onChange={(event) => setProductForm((state) => ({ ...state, imageUrls: event.target.value }))}
                    placeholder="Image URLs (one per line)"
                    className="w-full rounded-xl border border-[#f8f8f8] px-3 py-2 text-sm outline-none focus:border-[#f0d542]"
                  />
                </div>

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
          </>
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
