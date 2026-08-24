export default function CartDrawer({
    isOpen,
    onClose,
    cart,
    onUpdateQuantity,
    onRemove,
    total,
    onCheckout
}) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#111111] border-l border-[#2a2a2a] z-50 flex flex-col animate-slideIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Tu Carrito
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-white mb-1">Tu carrito está vacío</p>
                            <p className="text-sm text-[#a0a0a0]">¡Agrega algunas gorras increíbles!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]"
                                >
                                    <img
                                        src={item.imagen_url || 'https://placehold.co/80?text=Gorra'}
                                        alt={item.nombre}
                                        className="w-20 h-20 object-contain bg-[#0a0a0a] rounded-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white truncate">{item.nombre}</h4>
                                        <p className="text-[#c9a962] font-semibold">${item.precio.toLocaleString('es-AR')}</p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#c9a962] transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <span className="font-semibold w-6 text-center text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#c9a962] transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="p-2 text-[#a0a0a0] hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors self-start"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-[#2a2a2a] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[#a0a0a0]">Total:</span>
                            <span className="text-2xl font-bold text-[#c9a962]">${total.toLocaleString('es-AR')}</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
                        >
                            Finalizar Compra
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
