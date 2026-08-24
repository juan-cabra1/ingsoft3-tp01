import { Helmet } from 'react-helmet-async';
import NosotrosSection from '../components/NosotrosSection';

export default function NosotrosPage() {
    return (
        <>
            <Helmet>
                <title>Nosotros | Bako Lifestyle</title>
                <meta name="description" content="Conocé la historia de Bako Lifestyle. Gorras premium diseñadas en Córdoba, Argentina. Calidad, estilo y actitud." />
                <meta property="og:title" content="Nosotros | Bako Lifestyle" />
                <meta property="og:description" content="Conocé la historia de Bako Lifestyle. Gorras premium diseñadas en Córdoba, Argentina." />
                <meta property="og:image" content="https://bakolifestyle.com/assets/logo_bako_fondonegro.jpeg" />
            </Helmet>
            <NosotrosSection />
        </>
    );
}
