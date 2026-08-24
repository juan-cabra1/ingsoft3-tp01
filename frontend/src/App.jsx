import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactGA from 'react-ga4';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import { useCart } from './hooks/useCart';

// Pages — lazy loaded for route-level code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DropDetailPage = lazy(() => import('./pages/DropDetailPage'));
const SubcategoryPage = lazy(() => import('./pages/SubcategoryPage'));

// Modals — lazy loaded since they are rarely shown
const CheckoutForm = lazy(() => import('./components/CheckoutForm'));
const OrderSuccessModal = lazy(() => import('./components/OrderSuccessModal'));

function App() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    getCartForCheckout,
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to hash handling
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  // Initialize Analytics
  useEffect(() => {
    const GA_ID = import.meta.env.VITE_GA_ID;
    if (GA_ID) {
      ReactGA.initialize(GA_ID);
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (import.meta.env.VITE_GA_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  const handleCheckoutSuccess = (result) => {
    setOrderSuccess(result);
    setIsCheckoutOpen(false);
    clearCart();
    setIsCartOpen(false);
  };

  // Navigation helper for Navbar
  const handleNavigate = (path) => {
    // If path has hash, we might need to handle it specially if it's the same page?
    // But standard router/browser behavior should handle /#hash ok if we use Link or navigate
    // Navbar passes full path e.g. /#contacto
    navigate(path);
  };

  const handleViewDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleBackToStore = () => {
    navigate(-1);
  };

  // We check if current path is admin to conditionally render Navbar/Footer if needed.
  // The original App.jsx rendered AdminPanel entirely separately without Navbar/Footer.
  const isAdmin = location.pathname.startsWith('/bako-gestion');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/bako-gestion" element={<AdminPage />} />
      </Routes>
    );
  }

  const canonicalUrl = `https://bakolifestyle.com${location.pathname}`;

  const itemCount = useMemo(() => cart.reduce((c, item) => c + item.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((t, item) => t + item.precio * item.quantity, 0), [cart]);

  const jsonLd = useMemo(() => JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "Bako Lifestyle",
        "url": "https://bakolifestyle.com",
        "logo": "https://bakolifestyle.com/assets/logo_bako_fondonegro.jpeg",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+54-9-351-865-1885",
            "contactType": "customer service",
            "availableLanguage": "Spanish"
          }
        ],
        "sameAs": [
          "https://instagram.com/bako.lifestyle"
        ],
        "email": "bakolifestyle@gmail.com",
        "areaServed": {
          "@type": "City",
          "name": "Córdoba",
          "addressCountry": "AR"
        }
      },
      {
        "@type": "WebSite",
        "name": "Bako Lifestyle",
        "url": "https://bakolifestyle.com"
      }
    ]
  }), []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Helmet>
        <title>Bako Lifestyle | Gorras Premium</title>
        <meta name="description" content="Tienda oficial de Bako Lifestyle. Gorras de diseño exclusivo, calidad premium y estilo único. Comprá tu gorra online con envíos a toda Argentina desde Córdoba." />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Bako Lifestyle | Gorras Premium" />
        <meta property="og:description" content="Tienda oficial de Bako Lifestyle. Gorras de diseño exclusivo, calidad premium y estilo único." />
        <meta property="og:image" content="https://bakolifestyle.com/assets/products/black_1.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <Navbar
        cartItemCount={itemCount}
        onCartClick={() => setIsCartOpen(true)}
        navigate={handleNavigate}
      />

      <main>
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
          <Routes>
            <Route path="/" element={<HomePage addToCart={addToCart} handleViewDetail={handleViewDetail} />} />
            <Route path="/productos" element={<ProductsPage addToCart={addToCart} handleViewDetail={handleViewDetail} />} />
            <Route path="/nosotros" element={<NosotrosPage />} />
            <Route path="/product/:id" element={<ProductDetailPage addToCart={addToCart} handleBackToStore={handleBackToStore} />} />
            <Route path="/drops/:slug" element={<DropDetailPage addToCart={addToCart} handleViewDetail={handleViewDetail} />} />
            <Route path="/drops/:slug/:subSlug" element={<SubcategoryPage addToCart={addToCart} handleViewDetail={handleViewDetail} />} />
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Footer navigate={handleNavigate} />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        total={total}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Form */}
      {isCheckoutOpen && (
        <Suspense fallback={null}>
          <CheckoutForm
            cart={cart}
            cartForCheckout={getCartForCheckout()}
            total={total}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={handleCheckoutSuccess}
          />
        </Suspense>
      )}

      {/* Order Success Modal */}
      <Suspense fallback={null}>
        <OrderSuccessModal orderSuccess={orderSuccess} onContinue={() => setOrderSuccess(null)} />
      </Suspense>

      <SpeedInsights />
    </div>
  );
}

export default App;
