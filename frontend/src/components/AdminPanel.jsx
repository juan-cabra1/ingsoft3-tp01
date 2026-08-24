import { useState, useEffect, useRef } from 'react';
import { api, invalidateCache } from '../services/api';
import ImageUploader from './ImageUploader';
import { resolveImageUrl } from '../lib/resolveImageUrl';

// ─── Reorder arrows helper ──────────────────────────────────────────
function ReorderButtons({ index, total, onMoveUp, onMoveDown }) {
    return (
        <div className="flex flex-col gap-0.5">
            <button
                type="button"
                disabled={index === 0}
                onClick={onMoveUp}
                className="p-1 hover:bg-[var(--color-primary)]/20 rounded text-[var(--color-muted)] hover:text-[var(--color-primary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Mover arriba"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            </button>
            <button
                type="button"
                disabled={index === total - 1}
                onClick={onMoveDown}
                className="p-1 hover:bg-[var(--color-primary)]/20 rounded text-[var(--color-muted)] hover:text-[var(--color-primary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Mover abajo"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );
}

// ─── Subcategoria row inside expanded drop ──────────────────────────
function SubcategoriaRow({ sub, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd, onDelete, onEdit }) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] transition-all ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'border-t-2 border-[#c9a962]' : ''}`}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <svg className="w-4 h-4 flex-shrink-0 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 12h16M4 16h16" />
            </svg>
            {sub.imagen_url && (
                <img
                    src={resolveImageUrl(sub.imagen_url)}
                    alt={sub.nombre}
                    className="w-8 h-8 rounded object-cover"
                />
            )}
            <span className="flex-1 text-sm text-white">{sub.nombre}</span>
            <button
                type="button"
                onClick={onEdit}
                className="p-1.5 hover:bg-[var(--color-primary)]/20 rounded text-[var(--color-primary)] transition-colors"
                title="Editar"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
            <button
                type="button"
                onClick={onDelete}
                className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                title="Eliminar"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────
export default function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('admin_token'));
    const [token, setToken] = useState(() => sessionStorage.getItem('admin_token'));
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'drops'

    // Products state
    const [products, setProducts] = useState([]);
    const [filterDropId, setFilterDropId] = useState('');
    const [dragIdx, setDragIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);

    // Drops state
    const [drops, setDrops] = useState([]);
    const [expandedDropId, setExpandedDropId] = useState(null);
    const [dragDropIdx, setDragDropIdx] = useState(null);
    const [dragDropOverIdx, setDragDropOverIdx] = useState(null);
    const [dragSubIdx, setDragSubIdx] = useState(null);
    const [dragSubOverIdx, setDragSubOverIdx] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Product form
    const [editingProduct, setEditingProduct] = useState(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [productFormData, setProductFormData] = useState({
        nombre: '', precio: '', stock: '', imagen_url: '', imagenes: [],
        descripcion: '', detalle: '', drop_id: '', subcategoria_id: '',
    });

    // Drop form
    const [editingDrop, setEditingDrop] = useState(null);
    const [showDropForm, setShowDropForm] = useState(false);
    const [dropFormData, setDropFormData] = useState({ nombre: '', imagen_url: '', imagenes: [], activo: true });

    // Subcategoria form
    const [editingSub, setEditingSub] = useState(null);
    const [showSubForm, setShowSubForm] = useState(false);
    const [subFormDropId, setSubFormDropId] = useState(null);
    const [subFormData, setSubFormData] = useState({ nombre: '', imagen_url: '', imagenes: [] });

    // ── Data loading ─────────────────────────────────────────────────

    const loadProducts = async (tok = token) => {
        try {
            setLoading(true);
            const data = await api.adminGetProducts(tok);
            setProducts(data);
        } catch (err) {
            if (err.message === 'Sesión expirada') handleSessionExpired();
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadDrops = async (tok = token) => {
        try {
            setLoading(true);
            const data = await api.adminGetDrops(tok);
            setDrops(data);
        } catch (err) {
            if (err.message === 'Sesión expirada') handleSessionExpired();
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) {
            loadProducts();
            loadDrops();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSessionExpired = () => {
        setIsAuthenticated(false);
        setToken(null);
        sessionStorage.removeItem('admin_token');
    };

    // ── Auth ─────────────────────────────────────────────────────────

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await api.adminLogin(credentials.username, credentials.password);
            setToken(data.access_token);
            sessionStorage.setItem('admin_token', data.access_token);
            setIsAuthenticated(true);
            await Promise.all([loadProducts(data.access_token), loadDrops(data.access_token)]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setToken(null);
        sessionStorage.removeItem('admin_token');
        setCredentials({ username: '', password: '' });
        setProducts([]);
        setDrops([]);
    };

    // ── Product CRUD ─────────────────────────────────────────────────

    const resetProductForm = () => {
        setProductFormData({ nombre: '', precio: '', stock: '', imagen_url: '', imagenes: [], descripcion: '', detalle: '', drop_id: '', subcategoria_id: '' });
        setEditingProduct(null);
        setShowProductForm(false);
    };

    const handleProductEdit = (product) => {
        setEditingProduct(product);
        setProductFormData({
            nombre: product.nombre,
            precio: product.precio.toString(),
            stock: product.stock.toString(),
            imagen_url: product.imagen_url || '',
            imagenes: product.imagenes || [],
            descripcion: product.descripcion || '',
            detalle: product.detalle || '',
            drop_id: product.drop_id?.toString() || '',
            subcategoria_id: product.subcategoria_id?.toString() || '',
        });
        setShowProductForm(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const productData = {
            nombre: productFormData.nombre,
            precio: parseFloat(productFormData.precio),
            stock: parseInt(productFormData.stock),
            imagen_url: productFormData.imagenes.length > 0 ? productFormData.imagenes[0] : (productFormData.imagen_url || null),
            imagenes: productFormData.imagenes,
            descripcion: productFormData.descripcion || null,
            detalle: productFormData.detalle || null,
            drop_id: productFormData.drop_id ? parseInt(productFormData.drop_id) : null,
            subcategoria_id: productFormData.subcategoria_id ? parseInt(productFormData.subcategoria_id) : null,
        };
        try {
            if (editingProduct) {
                await api.adminUpdateProduct(editingProduct.id, productData, token);
            } else {
                await api.adminCreateProduct(productData, token);
            }
            invalidateCache();
            resetProductForm();
            loadProducts();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProductDelete = async (productId) => {
        if (!confirm('¿Eliminar este producto?')) return;
        setLoading(true);
        try {
            await api.adminDeleteProduct(productId, token);
            invalidateCache();
            loadProducts();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    // ── Product drag-and-drop ─────────────────────────────────────────
    const scrollTimerRef = useRef(null);

    const stopAutoScroll = () => {
        if (scrollTimerRef.current) {
            clearInterval(scrollTimerRef.current);
            scrollTimerRef.current = null;
        }
    };

    const handleDragStart = (index) => setDragIdx(index);

    // onDragEnter fires immediately on entry → instant highlight
    const handleDragEnter = (e, index) => {
        e.preventDefault();
        setDragOverIdx(index);
    };

    // onDragOver: prevent default (required for drop) + auto-scroll
    const handleDragOver = (e) => {
        e.preventDefault();
        const threshold = 80;
        const viewH = window.innerHeight;
        const y = e.clientY;
        if (y < threshold) {
            if (!scrollTimerRef.current) {
                scrollTimerRef.current = setInterval(() => window.scrollBy(0, -10), 16);
            }
        } else if (y > viewH - threshold) {
            if (!scrollTimerRef.current) {
                scrollTimerRef.current = setInterval(() => window.scrollBy(0, 10), 16);
            }
        } else {
            stopAutoScroll();
        }
    };

    const handleDragEnd = () => {
        stopAutoScroll();
        setDragIdx(null);
        setDragOverIdx(null);
    };

    const handleDrop = (toIndex) => {
        stopAutoScroll();
        if (dragIdx !== null && dragIdx !== toIndex) {
            handleProductReorder(filteredProducts, dragIdx, toIndex);
        }
        setDragIdx(null);
        setDragOverIdx(null);
    };

    const handleProductReorder = async (products, fromIndex, toIndex) => {
        const updated = [...products];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setProducts((prev) => {
            const rest = prev.filter((p) => !updated.find((u) => u.id === p.id));
            return [...updated, ...rest];
        });
        await api.adminReorderProducts(updated.map((p) => p.id), token);
        invalidateCache();
        loadProducts();
    };

    // ── Drop CRUD ─────────────────────────────────────────────────────

    const resetDropForm = () => {
        setDropFormData({ nombre: '', imagen_url: '', imagenes: [], activo: true });
        setEditingDrop(null);
        setShowDropForm(false);
    };

    const handleDropEdit = (drop) => {
        setEditingDrop(drop);
        const img = drop.imagen_url || '';
        setDropFormData({ nombre: drop.nombre, imagen_url: img, imagenes: img ? [img] : [], activo: drop.activo });
        setShowDropForm(true);
    };

    const handleDropSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const dropData = {
            nombre: dropFormData.nombre,
            imagen_url: dropFormData.imagenes.length > 0 ? dropFormData.imagenes[0] : (dropFormData.imagen_url || null),
            activo: dropFormData.activo,
        };
        try {
            if (editingDrop) {
                await api.adminUpdateDrop(editingDrop.id, dropData, token);
            } else {
                await api.adminCreateDrop(dropData, token);
            }
            invalidateCache();
            resetDropForm();
            loadDrops();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleDropDelete = async (dropId) => {
        if (!confirm('¿Eliminar este drop? Los productos quedarán sin asignar.')) return;
        setLoading(true);
        try {
            await api.adminDeleteDrop(dropId, token);
            invalidateCache();
            loadDrops();
            loadProducts();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleDropReorder = async (fromIndex, toIndex) => {
        const updated = [...drops];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setDrops(updated);
        await api.adminReorderDrops(updated.map((d) => d.id), token);
        invalidateCache();
        loadDrops();
    };

    const handleDropDragStart = (index) => setDragDropIdx(index);
    const handleDropDragOver = (e, index) => { e.preventDefault(); setDragDropOverIdx(index); };
    const handleDropDragEnd = () => { setDragDropIdx(null); setDragDropOverIdx(null); };
    const handleDropDrop = (toIndex) => {
        if (dragDropIdx !== null && dragDropIdx !== toIndex) {
            handleDropReorder(dragDropIdx, toIndex);
        }
        setDragDropIdx(null);
        setDragDropOverIdx(null);
    };

    const handleSubDragStart = (index) => setDragSubIdx(index);
    const handleSubDragOver = (e, index) => { e.preventDefault(); setDragSubOverIdx(index); };
    const handleSubDragEnd = () => { setDragSubIdx(null); setDragSubOverIdx(null); };
    const handleSubDrop = (dropId, subs, toIndex) => {
        if (dragSubIdx !== null && dragSubIdx !== toIndex) {
            handleSubReorder(dropId, subs, dragSubIdx, toIndex);
        }
        setDragSubIdx(null);
        setDragSubOverIdx(null);
    };

    // ── Subcategoria CRUD ─────────────────────────────────────────────

    const resetSubForm = () => {
        setSubFormData({ nombre: '', imagen_url: '', imagenes: [] });
        setEditingSub(null);
        setShowSubForm(false);
        setSubFormDropId(null);
    };

    const handleSubEdit = (sub, dropId) => {
        setEditingSub(sub);
        setSubFormDropId(dropId);
        const img = sub.imagen_url || '';
        setSubFormData({ nombre: sub.nombre, imagen_url: img, imagenes: img ? [img] : [] });
        setShowSubForm(true);
    };

    const handleSubCreate = (dropId) => {
        setSubFormDropId(dropId);
        setSubFormData({ nombre: '', imagen_url: '', imagenes: [] });
        setEditingSub(null);
        setShowSubForm(true);
    };

    const handleSubSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const subData = {
            nombre: subFormData.nombre,
            imagen_url: subFormData.imagenes.length > 0 ? subFormData.imagenes[0] : (subFormData.imagen_url || null),
        };
        try {
            if (editingSub) {
                await api.adminUpdateSubcategoria(editingSub.id, subData, token);
            } else {
                await api.adminCreateSubcategoria(subFormDropId, subData, token);
            }
            invalidateCache();
            resetSubForm();
            loadDrops();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleSubDelete = async (subId) => {
        if (!confirm('¿Eliminar esta subcategoría? Los productos quedarán sin subcategoría.')) return;
        setLoading(true);
        try {
            await api.adminDeleteSubcategoria(subId, token);
            invalidateCache();
            loadDrops();
            loadProducts();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleSubReorder = async (dropId, subs, fromIndex, toIndex) => {
        const updated = [...subs];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setDrops((prev) =>
            prev.map((d) => d.id === dropId ? { ...d, subcategorias: updated } : d)
        );
        await api.adminReorderSubcategorias(dropId, updated.map((s) => s.id), token);
        invalidateCache();
        loadDrops();
    };

    // ── Derived state ─────────────────────────────────────────────────

    const subcatOptions = () => {
        if (!productFormData.drop_id) return [];
        const drop = drops.find((d) => d.id === parseInt(productFormData.drop_id));
        return drop?.subcategorias || [];
    };

    const filteredProducts = filterDropId
        ? filterDropId === 'none'
            ? products.filter((p) => p.drop_id == null)
            : products.filter((p) => String(p.drop_id) === filterDropId)
        : products;

    // ── Login screen ─────────────────────────────────────────────────

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="glass rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold gradient-text">Panel de Administración</h1>
                            <p className="text-[var(--color-muted)] mt-2">Ingresá tus credenciales</p>
                        </div>
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
                        )}
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2">Usuario</label>
                                <input type="text" value={credentials.username} onChange={(e) => setCredentials((p) => ({ ...p, username: e.target.value }))} className="input" placeholder="admin" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Contraseña</label>
                                <input type="password" value={credentials.password} onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))} className="input" placeholder="••••••••" required />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                                {loading ? 'Verificando...' : 'Ingresar'}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <a href="/" className="text-[var(--color-primary)] hover:underline text-sm">← Volver a la tienda</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Admin dashboard ──────────────────────────────────────────────

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header + Nav */}
                <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Panel de Administración</h1>
                        <p className="text-[var(--color-muted)] mt-1">Bako Lifestyle</p>
                    </div>
                    <nav className="flex items-center gap-2 flex-wrap">
                        <a href="/" className="btn-secondary">Ver Tienda</a>
                        <button
                            onClick={() => setActiveTab('productos')}
                            className={`btn-secondary${activeTab === 'productos' ? ' !border-[#c9a962] !text-[#c9a962]' : ''}`}
                        >
                            Productos
                        </button>
                        <button
                            onClick={() => setActiveTab('drops')}
                            className={`btn-secondary${activeTab === 'drops' ? ' !border-[#c9a962] !text-[#c9a962]' : ''}`}
                        >
                            Drops
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary hover:!border-red-400 hover:!text-red-400"
                        >
                            Cerrar Sesión
                        </button>
                    </nav>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">{error}</div>
                )}

                {/* ═══════════════ PRODUCTOS TAB ═══════════════ */}
                {activeTab === 'productos' && (
                    <>
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <button
                                onClick={() => { resetProductForm(); setShowProductForm(true); }}
                                className="btn-primary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo Producto
                            </button>

                            {/* Filter by drop */}
                            {drops.length > 0 && (
                                <select
                                    value={filterDropId}
                                    onChange={(e) => setFilterDropId(e.target.value)}
                                    className="input py-2 text-sm w-auto"
                                >
                                    <option value="">Todos los drops</option>
                                    {drops.map((d) => (
                                        <option key={d.id} value={d.id.toString()}>{d.nombre}</option>
                                    ))}
                                    <option value="none">Sin drop asignado</option>
                                </select>
                            )}
                        </div>

                        {/* Product Form Modal */}
                        {showProductForm && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[var(--color-dark)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--color-primary)]/20 animate-fadeIn">
                                    <div className="flex items-center justify-between p-6 border-b border-[var(--color-primary)]/20">
                                        <h2 className="text-xl font-bold gradient-text">
                                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                        </h2>
                                        <button onClick={resetProductForm} className="p-2 hover:bg-[var(--color-darker)] rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleProductSubmit} className="p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Nombre *</label>
                                            <input type="text" name="nombre" value={productFormData.nombre} onChange={(e) => setProductFormData((p) => ({ ...p, nombre: e.target.value }))} className="input" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Precio *</label>
                                                <input type="number" step="0.01" name="precio" value={productFormData.precio} onChange={(e) => setProductFormData((p) => ({ ...p, precio: e.target.value }))} className="input" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Stock *</label>
                                                <input type="number" name="stock" value={productFormData.stock} onChange={(e) => setProductFormData((p) => ({ ...p, stock: e.target.value }))} className="input" required />
                                            </div>
                                        </div>

                                        {/* Drop selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Drop / Colección</label>
                                            <select
                                                value={productFormData.drop_id}
                                                onChange={(e) => setProductFormData((p) => ({ ...p, drop_id: e.target.value, subcategoria_id: '' }))}
                                                className="input"
                                            >
                                                <option value="">Sin drop</option>
                                                {drops.map((d) => (
                                                    <option key={d.id} value={d.id.toString()}>{d.nombre}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Subcategoria selector (only when drop has subs) */}
                                        {subcatOptions().length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Subcategoría</label>
                                                <select
                                                    value={productFormData.subcategoria_id}
                                                    onChange={(e) => setProductFormData((p) => ({ ...p, subcategoria_id: e.target.value }))}
                                                    className="input"
                                                >
                                                    <option value="">Sin subcategoría</option>
                                                    {subcatOptions().map((s) => (
                                                        <option key={s.id} value={s.id.toString()}>{s.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <ImageUploader
                                            images={productFormData.imagenes}
                                            onChange={(urls) => setProductFormData((p) => ({ ...p, imagenes: urls }))}
                                            token={token}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Descripción</label>
                                            <textarea name="descripcion" value={productFormData.descripcion} onChange={(e) => setProductFormData((p) => ({ ...p, descripcion: e.target.value }))} className="input min-h-[80px] resize-y" rows={3} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Detalle</label>
                                            <textarea name="detalle" value={productFormData.detalle} onChange={(e) => setProductFormData((p) => ({ ...p, detalle: e.target.value }))} className="input min-h-[80px] resize-y" rows={3} />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={resetProductForm} className="btn-secondary flex-1">Cancelar</button>
                                            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Products Table */}
                        <div className="glass rounded-2xl overflow-hidden">
                            {loading && products.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-12 text-center text-[var(--color-muted)]">
                                    {filterDropId === 'none'
                                        ? 'No hay productos sin drop asignado.'
                                        : 'No hay productos. ¡Creá el primero!'}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[var(--color-darker)]">
                                            <tr>
                                                <th className="p-4 w-8"></th>
                                                <th className="text-left p-4 font-semibold text-[var(--color-muted)]">Producto</th>
                                                <th className="text-left p-4 font-semibold text-[var(--color-muted)]">Drop</th>
                                                <th className="text-left p-4 font-semibold text-[var(--color-muted)]">Precio</th>
                                                <th className="text-left p-4 font-semibold text-[var(--color-muted)]">Stock</th>
                                                <th className="text-right p-4 font-semibold text-[var(--color-muted)]">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-primary)]/10">
                                            {filteredProducts.map((product, index) => {
                                                const dropName = drops.find((d) => d.id === product.drop_id)?.nombre;
                                                return (
                                                    <tr
                                                        key={product.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(index)}
                                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={() => handleDrop(index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`transition-all ${
                                                            dragIdx === index ? 'opacity-40' : 'hover:bg-[var(--color-darker)]/50'
                                                        } ${dragOverIdx === index && dragIdx !== index ? 'border-t-2 border-[#c9a962]' : ''}`}
                                                        style={{ cursor: dragIdx !== null ? 'grabbing' : 'grab' }}
                                                    >
                                                        <td className="p-4 text-[var(--color-muted)]">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 12h16M4 16h16" />
                                                            </svg>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={resolveImageUrl(product.imagen_url || (product.imagenes?.[0] ?? '')) || 'https://placehold.co/48?text=Gorra'}
                                                                    alt={product.nombre}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                                <span className="font-medium">{product.nombre}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-[var(--color-muted)]">
                                                            {dropName || <span className="text-[#444]">—</span>}
                                                        </td>
                                                        <td className="p-4 text-[var(--color-primary)] font-semibold">
                                                            ${product.precio.toLocaleString('es-AR')}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                                                product.stock > 10 ? 'bg-green-500/20 text-green-400'
                                                                : product.stock > 0 ? 'bg-amber-500/20 text-amber-400'
                                                                : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                                {product.stock} uds.
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => handleProductEdit(product)} className="p-2 hover:bg-[var(--color-primary)]/20 rounded-lg text-[var(--color-primary)] transition-colors" title="Editar">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => handleProductDelete(product.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title="Eliminar">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════════════ DROPS TAB ═══════════════ */}
                {activeTab === 'drops' && (
                    <>
                        <div className="mb-6">
                            <button
                                onClick={() => { resetDropForm(); setShowDropForm(true); }}
                                className="btn-primary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo Drop
                            </button>
                        </div>

                        {/* Drop Form Modal */}
                        {showDropForm && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[var(--color-dark)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--color-primary)]/20 animate-fadeIn">
                                    <div className="flex items-center justify-between p-6 border-b border-[var(--color-primary)]/20">
                                        <h2 className="text-xl font-bold gradient-text">
                                            {editingDrop ? 'Editar Drop' : 'Nuevo Drop'}
                                        </h2>
                                        <button onClick={resetDropForm} className="p-2 hover:bg-[var(--color-darker)] rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <form onSubmit={handleDropSubmit} className="p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Nombre *</label>
                                            <input
                                                type="text"
                                                value={dropFormData.nombre}
                                                onChange={(e) => setDropFormData((p) => ({ ...p, nombre: e.target.value }))}
                                                className="input"
                                                placeholder="ej: Mazo 3"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="activo"
                                                checked={dropFormData.activo}
                                                onChange={(e) => setDropFormData((p) => ({ ...p, activo: e.target.checked }))}
                                                className="w-4 h-4 accent-[var(--color-primary)]"
                                            />
                                            <label htmlFor="activo" className="text-sm font-medium">Visible en la tienda</label>
                                        </div>
                                        <ImageUploader
                                            images={dropFormData.imagenes}
                                            onChange={(urls) => setDropFormData((p) => ({ ...p, imagenes: urls }))}
                                            token={token}
                                            label="Imágenes del Drop"
                                        />
                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={resetDropForm} className="btn-secondary flex-1">Cancelar</button>
                                            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Subcategoria Form Modal */}
                        {showSubForm && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[var(--color-dark)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--color-primary)]/20 animate-fadeIn">
                                    <div className="flex items-center justify-between p-6 border-b border-[var(--color-primary)]/20">
                                        <h2 className="text-xl font-bold gradient-text">
                                            {editingSub ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
                                        </h2>
                                        <button onClick={resetSubForm} className="p-2 hover:bg-[var(--color-darker)] rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubSubmit} className="p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Nombre *</label>
                                            <input
                                                type="text"
                                                value={subFormData.nombre}
                                                onChange={(e) => setSubFormData((p) => ({ ...p, nombre: e.target.value }))}
                                                className="input"
                                                placeholder="ej: Planas"
                                                required
                                            />
                                        </div>
                                        <ImageUploader
                                            images={subFormData.imagenes}
                                            onChange={(urls) => setSubFormData((p) => ({ ...p, imagenes: urls }))}
                                            token={token}
                                            label="Imágenes de la Subcategoría"
                                        />
                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={resetSubForm} className="btn-secondary flex-1">Cancelar</button>
                                            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Drops list */}
                        {loading && drops.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : drops.length === 0 ? (
                            <div className="glass rounded-2xl p-12 text-center text-[var(--color-muted)]">
                                No hay drops. ¡Creá el primero!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {drops.map((drop, index) => (
                                    <div
                                        key={drop.id}
                                        draggable
                                        onDragStart={() => handleDropDragStart(index)}
                                        onDragOver={(e) => handleDropDragOver(e, index)}
                                        onDrop={() => handleDropDrop(index)}
                                        onDragEnd={handleDropDragEnd}
                                        className={`glass rounded-2xl overflow-hidden transition-all ${
                                            dragDropIdx === index ? 'opacity-40' : ''
                                        } ${dragDropOverIdx === index && dragDropIdx !== index ? 'ring-2 ring-[#c9a962]' : ''}`}
                                        style={{ cursor: dragDropIdx !== null ? 'grabbing' : 'grab' }}
                                    >
                                        {/* Drop header row */}
                                        <div className="flex items-center gap-3 p-4">
                                            <svg className="w-4 h-4 flex-shrink-0 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 12h16M4 16h16" />
                                            </svg>
                                            {drop.imagen_url && (
                                                <img
                                                    src={resolveImageUrl(drop.imagen_url)}
                                                    alt={drop.nombre}
                                                    className="w-14 h-14 rounded-xl object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white truncate">{drop.nombre}</span>
                                                    {!drop.activo && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-[var(--color-muted)]">Oculto</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-[var(--color-muted)]">
                                                    {drop.subcategorias?.length || 0} subcategorías
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setExpandedDropId(expandedDropId === drop.id ? null : drop.id)}
                                                    className="p-2 hover:bg-[var(--color-primary)]/10 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors text-sm flex items-center gap-1"
                                                >
                                                    <svg className={`w-4 h-4 transition-transform ${expandedDropId === drop.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    Subcats
                                                </button>
                                                <button onClick={() => handleDropEdit(drop)} className="p-2 hover:bg-[var(--color-primary)]/20 rounded-lg text-[var(--color-primary)] transition-colors" title="Editar">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleDropDelete(drop.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title="Eliminar">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded subcategoria panel */}
                                        {expandedDropId === drop.id && (
                                            <div className="px-4 pb-4 border-t border-[var(--color-primary)]/10 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-[var(--color-muted)]">Subcategorías</span>
                                                    <button
                                                        onClick={() => handleSubCreate(drop.id)}
                                                        className="text-xs px-3 py-1.5 bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Agregar
                                                    </button>
                                                </div>
                                                {(!drop.subcategorias || drop.subcategorias.length === 0) ? (
                                                    <p className="text-xs text-[var(--color-muted)] py-2">Sin subcategorías. Las gorras de este drop se muestran directamente.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {drop.subcategorias.map((sub, subIndex) => (
                                                            <SubcategoriaRow
                                                                key={sub.id}
                                                                sub={sub}
                                                                isDragging={dragSubIdx === subIndex}
                                                                isDragOver={dragSubOverIdx === subIndex && dragSubIdx !== subIndex}
                                                                onDragStart={() => handleSubDragStart(subIndex)}
                                                                onDragOver={(e) => handleSubDragOver(e, subIndex)}
                                                                onDrop={() => handleSubDrop(drop.id, drop.subcategorias, subIndex)}
                                                                onDragEnd={handleSubDragEnd}
                                                                onEdit={() => handleSubEdit(sub, drop.id)}
                                                                onDelete={() => handleSubDelete(sub.id)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
