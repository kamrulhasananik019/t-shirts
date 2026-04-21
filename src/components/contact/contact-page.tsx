"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Send,
} from "lucide-react";
import type { CategoryWithProducts } from "@/lib/catalog";

const CUSTOM_CATEGORY_VALUE = "__custom_category__";
const CUSTOM_PRODUCT_VALUE = "__custom_product__";

const humanizeValue = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeForMatch = (value: string) =>
  humanizeValue(value).toLowerCase();

const contactMethods = [
  {
    icon: Phone,
    label: "Call the studio",
    value: "+44 (20) 555-0147",
    href: "tel:+44205550147",
    helper: "Available 24/7",
  },
  {
    icon: Mail,
    label: "Send your brief",
    value: "hello@primeprints.co.uk",
    href: "mailto:hello@primeprints.co.uk",
    helper: "Share artwork, quantities, and deadlines",
  },
  {
    icon: MapPin,
    label: "Visit the shop",
    value: "123 Printing Street, London, UK",
    href: "https://maps.google.com/?q=London%2C%20UK",
    helper: "Samples, pickups, and paper consultations",
  },
];

const officeHours = [
  { day: "Every day", hours: "24/7" },
];

type ContactPageContentProps = {
  categories: CategoryWithProducts[];
};

export default function ContactPageContent({ categories }: ContactPageContentProps) {
  const searchParams = useSearchParams();

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const initialSelection = useMemo(() => {
    const categoryParam = searchParams.get("category")?.trim() || "";
    const productParam = searchParams.get("product")?.trim() || "";

    if (!categoryParam && !productParam) {
      return {
        categorySlug: "",
        productSlug: "",
        customCategoryText: "",
        customProductText: "",
      };
    }

    const normalizedCategoryParam = normalizeForMatch(categoryParam);

    const matchedCategory = sortedCategories.find(
      (category) =>
        category.id === categoryParam ||
        normalizeForMatch(category.name) === normalizedCategoryParam
    );

    if (matchedCategory) {
      const normalizedProductParam = normalizeForMatch(productParam);
      const matchedProduct = matchedCategory.products.find(
        (product) =>
          product.id === productParam ||
          normalizeForMatch(product.name) === normalizedProductParam
      );

      return {
        categorySlug: matchedCategory.id,
        productSlug: matchedProduct
          ? matchedProduct.id
          : productParam
            ? CUSTOM_PRODUCT_VALUE
            : "",
        customCategoryText: "",
        customProductText: matchedProduct ? "" : humanizeValue(productParam),
      };
    }

    return {
      categorySlug: categoryParam ? CUSTOM_CATEGORY_VALUE : "",
      productSlug: productParam ? CUSTOM_PRODUCT_VALUE : "",
      customCategoryText: humanizeValue(categoryParam),
      customProductText: humanizeValue(productParam),
    };
  }, [searchParams, sortedCategories]);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState(
    initialSelection.categorySlug
  );
  const [selectedProductSlug, setSelectedProductSlug] = useState(
    initialSelection.productSlug
  );
  const [customCategory, setCustomCategory] = useState(
    initialSelection.customCategoryText
  );
  const [customProduct, setCustomProduct] = useState(
    initialSelection.customProductText
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const selectedCategory = sortedCategories.find(
    (category) => category.id === selectedCategorySlug
  );

  const productsForCategory = selectedCategory
    ? [...selectedCategory.products].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const isCustomCategory = selectedCategorySlug === CUSTOM_CATEGORY_VALUE;
  const isCustomProduct = selectedProductSlug === CUSTOM_PRODUCT_VALUE;
  const canSelectProduct = Boolean(selectedCategorySlug);

  const selectedCategoryTitle = isCustomCategory
    ? customCategory.trim()
    : selectedCategory?.name || "";

  const selectedProductTitle = isCustomProduct
    ? customProduct.trim()
    : productsForCategory.find((product) => product.id === selectedProductSlug)?.name || "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      categoryTitle: selectedCategoryTitle,
      product: String(formData.get("product") || "").trim(),
      productTitle: selectedProductTitle,
      deadline: String(formData.get("deadline") || "").trim(),
      details: String(formData.get("details") || "").trim(),
    };

    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "We could not send your request. Please try again.");
      }

      form.reset();
      setSelectedCategorySlug("");
      setSelectedProductSlug("");
      setCustomCategory("");
      setCustomProduct("");
      setSubmitMessage(result.message || "Your request has been sent successfully.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#0a72b2] font-sans">
      <header className="relative overflow-hidden border-b border-[#F8F8F8] bg-white">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#F0D542]/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#0a72b2]/25 blur-3xl" />
        <div className="relative container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-[#0a72b2] transition hover:text-[#0a72b2]"
          >
            <ArrowRight className="size-4 rotate-180" />
            Back to home
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#0a72b2]">
                Client Support Desk
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-[#0a72b2] sm:text-5xl">
                Contact Prime Prints
              </h1>
              <p className="mt-4 text-lg leading-8 text-[#0a72b2]">
                Speak to a print team that understands deadlines, details, and delivery.
                Share your category, product, quantities, and timeline and we&apos;ll send
                a clear production plan with lead times.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F8F8F8] bg-[#F8F8F8]/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a72b2]">
                Why clients choose us
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-[#0a72b2]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#F0D542]" />
                  Fast quote turnarounds with practical print recommendations
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#F0D542]" />
                  Artwork checks and finish guidance before production
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#F0D542]" />
                  Reliable delivery windows for business and event timelines
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[#F8F8F8] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-2 text-2xl font-bold text-[#0a72b2]">Send us a request</h2>
              <p className="mb-6 text-sm text-[#0a72b2]">
                Fill in your details and select a category and product so our team can prepare the right quote.
              </p>
              
              {submitMessage && (
                <div className="mb-6 rounded-xl border border-[#F0D542]/30 bg-[#F8F8F8] p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <Send className="h-5 w-5 text-[#F0D542]" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[#0a72b2]">
                        {submitMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              )}

              <form
                className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8"
                onSubmit={handleSubmit}
                onChange={() => {
                  setSubmitMessage("");
                  setSubmitError("");
                }}
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#0a72b2]">Full name</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      placeholder="Alex Morgan"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-[#0a72b2]">Company</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="company"
                      id="company"
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      placeholder="North Studio"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#0a72b2]">Email address</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      placeholder="alex@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#0a72b2]">Phone number</label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      placeholder="+44 20 5550 0147"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-[#0a72b2]">Category</label>
                  <div className="mt-1">
                    <select
                      id="category"
                      name="category"
                      required
                      value={selectedCategorySlug}
                      onChange={(event) => {
                        const nextCategoryValue = event.target.value;
                        setSelectedCategorySlug(nextCategoryValue);
                        setSelectedProductSlug(
                          nextCategoryValue === CUSTOM_CATEGORY_VALUE
                            ? CUSTOM_PRODUCT_VALUE
                            : ""
                        );
                        if (nextCategoryValue !== CUSTOM_CATEGORY_VALUE) {
                          setCustomCategory("");
                        }
                        setCustomProduct("");
                      }}
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                    >
                      <option value="" disabled>Select a category</option>
                      {sortedCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                      <option value={CUSTOM_CATEGORY_VALUE}>Other (write custom)</option>
                    </select>
                  </div>
                </div>

                {isCustomCategory && (
                  <div>
                    <label htmlFor="customCategory" className="block text-sm font-medium text-[#0a72b2]">
                      Custom category
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="customCategory"
                        name="customCategory"
                        value={customCategory}
                        onChange={(event) => setCustomCategory(event.target.value)}
                        required={isCustomCategory}
                        placeholder="Write your category"
                        className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-[#0a72b2]">Category product</label>
                  <div className="mt-1">
                    <select
                      id="product"
                      name="product"
                      required
                      value={selectedProductSlug}
                      onChange={(event) => {
                        const nextProductValue = event.target.value;
                        setSelectedProductSlug(nextProductValue);

                        if (
                          nextProductValue === CUSTOM_PRODUCT_VALUE &&
                          selectedCategorySlug &&
                          selectedCategorySlug !== CUSTOM_CATEGORY_VALUE
                        ) {
                          setCustomCategory((previous) => previous || selectedCategory?.name || "");
                          setSelectedCategorySlug(CUSTOM_CATEGORY_VALUE);
                        }
                      }}
                      disabled={!canSelectProduct}
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10 disabled:cursor-not-allowed disabled:bg-[#F8F8F8] disabled:text-[#0a72b2]"
                    >
                      <option value="" disabled>
                        {selectedCategorySlug ? "Select a product" : "Select category first"}
                      </option>
                      {isCustomCategory
                        ? null
                        : productsForCategory.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                      <option value={CUSTOM_PRODUCT_VALUE}>Other (write custom)</option>
                    </select>
                  </div>
                </div>

                {isCustomProduct && (
                  <div>
                    <label htmlFor="customProduct" className="block text-sm font-medium text-[#0a72b2]">
                      Custom product
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="customProduct"
                        name="customProduct"
                        value={customProduct}
                        onChange={(event) => setCustomProduct(event.target.value)}
                        required={isCustomProduct}
                        placeholder="Write your product"
                        className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-[#0a72b2]">Needed by</label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="deadline"
                      id="deadline"
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="details" className="block text-sm font-medium text-[#0a72b2]">Project details</label>
                  <div className="mt-1">
                    <textarea
                      id="details"
                      name="details"
                      rows={4}
                      required
                      className="block w-full rounded-xl border border-[#F8F8F8] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/10"
                      placeholder="Tell us quantities, sizes, finishes, delivery preferences, and any artwork support needed."
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-4 border-t border-[#F8F8F8] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#0a72b2]">
                    By sending this form, you agree to be contacted regarding your quote.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0a72b2] bg-[#0a72b2] px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-[#F0D542] focus:outline-none focus:ring-2 focus:ring-[#F0D542]/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#0a72b2]"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-12 space-y-8 lg:col-span-1 lg:mt-0">

            <div className="rounded-2xl border border-[#F8F8F8] bg-[#0a72b2] p-6 text-white sm:p-8">
              <h3 className="text-lg font-semibold">Need a fast quote?</h3>
              <p className="mt-2 text-sm text-[#F8F8F8]/80">
                Select your category and product in the form for quicker pricing and production estimates.
              </p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-amber-300" />
                  Choose a category
                </div>
                <div className="flex items-center gap-2">
                  <PackageSearch className="h-4 w-4 text-amber-300" />
                  Pick the exact product
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-amber-300" />
                  Share your deadline
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="mb-6 text-lg font-semibold text-stone-900">Contact Information</h3>
              <dl className="space-y-6">
                {contactMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.label} className="flex gap-x-4">
                      <dt className="flex-none">
                        <span className="sr-only">{method.label}</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                          <Icon className="h-5 w-5 text-stone-700" aria-hidden="true" />
                        </div>
                      </dt>
                      <dd className="flex-auto">
                        <p className="text-sm font-semibold text-stone-900">
                          <a href={method.href} className="transition hover:text-stone-600">{method.value}</a>
                        </p>
                        <p className="mt-1 text-sm text-stone-500">{method.helper}</p>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Clock3 className="h-5 w-5 text-stone-500" />
                <h3 className="text-lg font-semibold text-stone-900">Studio Hours</h3>
              </div>
              <ul className="space-y-3">
                {officeHours.map((entry) => (
                  <li key={entry.day} className="flex justify-between text-sm">
                    <span className="text-stone-500">{entry.day}</span>
                    <span className="font-medium text-stone-900">{entry.hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="relative h-48 w-full bg-stone-200">
                 <iframe
                  title="Prime Prints location map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d158857.839887706!2d-0.266403!3d51.528308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              </div>
              <div className="border-t border-stone-200 bg-stone-50 p-4">
                <p className="text-center text-sm text-stone-600">
                  Drop in for samples, pickups, and paper advice.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}