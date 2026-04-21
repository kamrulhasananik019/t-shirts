export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getCategoryPath(id: string, name: string): string {
  return `/categories/${toSlug(name) || id}`;
}

export function getProductPath(id: string, name: string, slug?: string): string {
  return `/products/${slug || toSlug(name) || id}`;
}
