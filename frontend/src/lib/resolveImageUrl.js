/**
 * Resolve image URL — /uploads/... paths need the backend URL prefix.
 * Shared utility used by ProductCard, ProductDetail, and AdminPanel.
 */
export function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        return `${baseUrl}${url}`;
    }
    return url;
}
