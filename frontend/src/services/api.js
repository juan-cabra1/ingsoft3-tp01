const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function generateRequestId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

async function tracedFetch(url, options = {}) {
  const requestId = generateRequestId();
  const headers = {
    ...options.headers,
    'X-Request-ID': requestId,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      console.error(`[${requestId}] ${options.method || 'GET'} ${url} → ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error(`[${requestId}] ${options.method || 'GET'} ${url} → NETWORK ERROR:`, error.message);
    throw error;
  }
}

const responseCache = new Map();
const CACHE_TTL = 3.5 * 60_000; // 3.5 minutes

async function cachedGet(url) {
    const entry = responseCache.get(url);
    if (entry && Date.now() - entry.ts < CACHE_TTL) {
        return entry.data;
    }
    const res = await tracedFetch(url);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || res.statusText);
    }
    const data = await res.json();
    responseCache.set(url, { data, ts: Date.now() });
    return data;
}

export function invalidateCache() {
    responseCache.clear();
}

export const api = {
    // ──────────── Public Endpoints ────────────

    async getProducts() {
        return cachedGet(`${API_BASE_URL}/products`);
    },

    async getProduct(id) {
        return cachedGet(`${API_BASE_URL}/products/${id}`);
    },

    // Checkout
    async generateWhatsAppLink(cart, customer) {
        const response = await tracedFetch(`${API_BASE_URL}/checkout/generate-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, customer }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error en el checkout');
        }
        return response.json();
    },

    // ──────────── Admin Auth (JWT) ────────────

    async adminLogin(username, password) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error('Credenciales incorrectas');
            throw new Error('Error al iniciar sesión');
        }
        return response.json(); // { access_token, token_type }
    },

    // ──────────── Admin CRUD (JWT Protected) ────────────

    async adminGetProducts(token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/products`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al cargar productos');
        }
        return response.json();
    },

    async adminCreateProduct(product, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(product),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al crear producto');
        }
        return response.json();
    },

    async adminUpdateProduct(id, product, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(product),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al actualizar producto');
        }
        return response.json();
    },

    async adminDeleteProduct(id, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al eliminar producto');
        }
        return true;
    },

    // ──────────── Image Upload ────────────

    async uploadImage(file, token) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await tracedFetch(`${API_BASE_URL}/admin/upload-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al subir imagen');
        }
        return response.json(); // { url: "/uploads/products/..." }
    },

    // ──────────── Public: Drops ────────────

    async getDrops() {
        return cachedGet(`${API_BASE_URL}/drops`);
    },

    async getDrop(slug) {
        return cachedGet(`${API_BASE_URL}/drops/${slug}`);
    },

    async getDropProducts(slug, subSlug = null) {
        const url = subSlug
            ? `${API_BASE_URL}/drops/${slug}/${subSlug}/products`
            : `${API_BASE_URL}/drops/${slug}/products`;
        return cachedGet(url);
    },

    // ──────────── Admin: Drops ────────────

    async adminGetDrops(token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al cargar drops');
        }
        return response.json();
    },

    async adminCreateDrop(drop, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(drop),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al crear drop');
        }
        return response.json();
    },

    async adminUpdateDrop(id, drop, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(drop),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al actualizar drop');
        }
        return response.json();
    },

    async adminDeleteDrop(id, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al eliminar drop');
        }
        return true;
    },

    async adminReorderDrops(orderedIds, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ordered_ids: orderedIds }),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al reordenar drops');
        }
        return true;
    },

    // ──────────── Admin: Subcategorias ────────────

    async adminGetSubcategorias(dropId, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops/${dropId}/subcategorias`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al cargar subcategorías');
        }
        return response.json();
    },

    async adminCreateSubcategoria(dropId, sub, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/drops/${dropId}/subcategorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(sub),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al crear subcategoría');
        }
        return response.json();
    },

    async adminUpdateSubcategoria(subId, sub, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/subcategorias/${subId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(sub),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al actualizar subcategoría');
        }
        return response.json();
    },

    async adminDeleteSubcategoria(subId, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/subcategorias/${subId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al eliminar subcategoría');
        }
        return true;
    },

    async adminReorderSubcategorias(dropId, orderedIds, token) {
        const response = await tracedFetch(
            `${API_BASE_URL}/admin/drops/${dropId}/subcategorias/reorder`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ordered_ids: orderedIds }),
            }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al reordenar subcategorías');
        }
        return true;
    },

    async adminReorderProducts(orderedIds, token) {
        const response = await tracedFetch(`${API_BASE_URL}/admin/products/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ordered_ids: orderedIds }),
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sesión expirada');
            throw new Error('Error al reordenar productos');
        }
        return true;
    },

    // ──────────── Error Reporting ────────────

    async reportError(errorData) {
        try {
            await tracedFetch(`${API_BASE_URL}/debug/report-error`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: errorData.message || 'Unknown error',
                    source: errorData.source || '',
                    line: errorData.line || null,
                    col: errorData.col || null,
                    stack: errorData.stack || '',
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                }),
            });
        } catch {
            // Silently fail — don't create error loops
        }
    },
};
