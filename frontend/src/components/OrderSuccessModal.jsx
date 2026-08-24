export default function OrderSuccessModal({ orderSuccess, onContinue }) {
    if (!orderSuccess) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl max-w-md w-full p-8 text-center animate-fadeIn">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">¡Pedido Enviado!</h3>
                <p className="text-[#a0a0a0] mb-4">
                    Tu pedido <span className="font-mono text-[#c9a962]">#{orderSuccess.order_id}</span> fue enviado por WhatsApp.
                </p>
                <p className="text-lg font-semibold mb-6 text-white">
                    Total: <span className="text-[#c9a962]">${orderSuccess.total.toLocaleString('es-AR')}</span>
                </p>
                <button onClick={onContinue} className="btn-primary w-full">
                    Continuar Comprando
                </button>
            </div>
        </div>
    );
}
