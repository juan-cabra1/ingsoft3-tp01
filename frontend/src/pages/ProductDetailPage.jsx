import { useParams } from 'react-router-dom';
import ProductDetail from '../components/ProductDetail';

export default function ProductDetailPage({ addToCart, handleBackToStore }) {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <ProductDetail
                productId={id}
                onAddToCart={addToCart}
                onBack={handleBackToStore}
            />
        </div>
    );
}
