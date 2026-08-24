import { useState } from 'react';
import { api } from '../services/api';

const METODOS_ENTREGA = [
    { value: 'Envío', label: 'Envío a domicilio' },
    { value: 'Punto de venta', label: 'Retiro en punto de venta' },
];

const PROVINCIAS_AR = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán',
];

// Stricter email regex: user@domain.tld (tld min 2 chars)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Address must contain at least one word and a number (e.g. "Av. Corrientes 1234")
const ADDRESS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.]+\s+\d+/;

export default function CheckoutForm({ cart, cartForCheckout, total, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        metodo_entrega: 'Envío',
        direccion: '',
        provincia: '',
        ciudad: '',
        codigo_postal: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState(null);

    const validate = () => {
        const newErrors = {};

        // Nombre: no vacío, mínimo 2 caracteres
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        // Teléfono: solo dígitos, entre 8 y 15
        const phoneDigits = formData.telefono.replace(/[\s\-+]/g, '');
        if (!formData.telefono.trim()) {
            newErrors.telefono = 'El teléfono es requerido';
        } else if (!/^\d+$/.test(phoneDigits)) {
            newErrors.telefono = 'El teléfono solo debe contener números';
        } else if (phoneDigits.length < 8 || phoneDigits.length > 15) {
            newErrors.telefono = 'El teléfono debe tener entre 8 y 15 dígitos';
        }

        // Email: regex estricto
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!EMAIL_REGEX.test(formData.email.trim())) {
            newErrors.email = 'Ingresa un email válido (ej: juan@ejemplo.com)';
        }

        // Campos condicionales para envío
        if (formData.metodo_entrega === 'Envío') {
            // Dirección: requerida y debe tener formato calle + número
            if (!formData.direccion.trim()) {
                newErrors.direccion = 'La dirección es requerida para envíos';
            } else if (!ADDRESS_REGEX.test(formData.direccion.trim())) {
                newErrors.direccion = 'Ingresa una dirección válida (ej: Av. Corrientes 1234)';
            }

            // Provincia
            if (!formData.provincia) {
                newErrors.provincia = 'La provincia es requerida';
            }

            // Ciudad
            if (!formData.ciudad.trim()) {
                newErrors.ciudad = 'La ciudad es requerida';
            }

            // Código Postal
            if (!formData.codigo_postal.trim()) {
                newErrors.codigo_postal = 'El código postal es requerido';
            } else if (!/^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/.test(formData.codigo_postal.trim())) {
                newErrors.codigo_postal = 'Código postal inválido (ej: 5000 o X5000)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
        setServerError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;
        if (cart.length === 0) {
            setServerError('El carrito está vacío');
            return;
        }

        setLoading(true);
        setServerError(null);

        try {
            const customerData = {
                ...formData,
                provincia: formData.metodo_entrega === 'Envío' ? formData.provincia : undefined,
                ciudad: formData.metodo_entrega === 'Envío' ? formData.ciudad : undefined,
                codigo_postal: formData.metodo_entrega === 'Envío' ? formData.codigo_postal : undefined,
                direccion: formData.metodo_entrega === 'Envío' ? formData.direccion : undefined,
            };
            const result = await api.generateWhatsAppLink(cartForCheckout, customerData);
            window.location.href = result.whatsapp_url;
            onSuccess(result);
        } catch (err) {
            setServerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isEnvio = formData.metodo_entrega === 'Envío';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                    <h2 className="text-xl font-bold text-white">Finalizar Compra</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Order Summary */}
                <div className="p-6 bg-[#0a0a0a] border-b border-[#2a2a2a]">
                    <h3 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-3">
                        Resumen del Pedido
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-white">
                                    {item.nombre} <span className="text-[#a0a0a0]">x{item.quantity}</span>
                                </span>
                                <span className="font-medium text-white">
                                    ${(item.precio * item.quantity).toLocaleString('es-AR')}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#2a2a2a]">
                        <span className="font-semibold text-white">Total:</span>
                        <span className="text-xl font-bold text-[#c9a962]">${total.toLocaleString('es-AR')}</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {serverError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {serverError}
                        </div>
                    )}

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className={`input ${errors.nombre ? 'input-error' : ''}`}
                            placeholder="Juan Pérez"
                        />
                        {errors.nombre && <p className="error-message">{errors.nombre}</p>}
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            maxLength={18}
                            className={`input ${errors.telefono ? 'input-error' : ''}`}
                            placeholder="1155554444"
                        />
                        {errors.telefono && <p className="error-message">{errors.telefono}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`input ${errors.email ? 'input-error' : ''}`}
                            placeholder="juan@ejemplo.com"
                        />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>

                    {/* Método de Entrega */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Método de entrega *
                        </label>
                        <select
                            name="metodo_entrega"
                            value={formData.metodo_entrega}
                            onChange={handleChange}
                            className="select"
                        >
                            {METODOS_ENTREGA.map((metodo) => (
                                <option key={metodo.value} value={metodo.value}>
                                    {metodo.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Campos de envío (condicionales) */}
                    {isEnvio && (
                        <div className="space-y-5 animate-fadeIn">
                            {/* Dirección */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Dirección de envío *
                                </label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    className={`input ${errors.direccion ? 'input-error' : ''}`}
                                    placeholder="Av. Corrientes 1234, Piso 2 Depto A"
                                />
                                {errors.direccion && <p className="error-message">{errors.direccion}</p>}
                            </div>

                            {/* Provincia y Ciudad */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Provincia *
                                    </label>
                                    <select
                                        name="provincia"
                                        value={formData.provincia}
                                        onChange={handleChange}
                                        className={`select ${errors.provincia ? 'input-error' : ''}`}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {PROVINCIAS_AR.map((prov) => (
                                            <option key={prov} value={prov}>{prov}</option>
                                        ))}
                                    </select>
                                    {errors.provincia && <p className="error-message">{errors.provincia}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Ciudad *
                                    </label>
                                    <input
                                        type="text"
                                        name="ciudad"
                                        value={formData.ciudad}
                                        onChange={handleChange}
                                        className={`input ${errors.ciudad ? 'input-error' : ''}`}
                                        placeholder="Córdoba"
                                    />
                                    {errors.ciudad && <p className="error-message">{errors.ciudad}</p>}
                                </div>
                            </div>

                            {/* Código Postal */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Código Postal *
                                </label>
                                <input
                                    type="text"
                                    name="codigo_postal"
                                    value={formData.codigo_postal}
                                    onChange={handleChange}
                                    maxLength={8}
                                    className={`input max-w-[200px] ${errors.codigo_postal ? 'input-error' : ''}`}
                                    placeholder="5000"
                                />
                                {errors.codigo_postal && <p className="error-message">{errors.codigo_postal}</p>}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || cart.length === 0}
                        className="w-full py-4 text-base font-semibold rounded-full flex items-center justify-center gap-3 bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Generando enlace...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Enviar por WhatsApp
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
