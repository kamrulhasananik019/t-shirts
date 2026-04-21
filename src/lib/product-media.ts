export function getPrimaryImage(product: { images?: { url: string }[]; imageUrl?: string[] } | null | undefined): string {
  if (!product) return '';
  
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage && typeof firstImage === 'object' && 'url' in firstImage && firstImage.url) {
      return String(firstImage.url);
    }
  }
  
  if (Array.isArray(product.imageUrl) && product.imageUrl.length > 0) {
    const firstUrl = product.imageUrl[0];
    if (firstUrl) {
      return String(firstUrl);
    }
  }
  
  return '';
}
