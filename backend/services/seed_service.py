from sqlalchemy.orm import Session
from models.product import ProductModel
from logging_config import get_logger

logger = get_logger("seeder")

def seed_products(db: Session):
    """
    Seed initial products if the database is empty.
    Also updates existing products with images if they are missing.
    """
    # Image mapping for seeding
    IMAGE_MAP = {
        "Black As": ["/assets/products/black_1.jpg", "/assets/products/black_2.jpeg", "/assets/products/trasera_negras.jpeg"],
        "Vibe": ["/assets/products/vibe_1.jpg", "/assets/products/vibe_2.jpeg", "/assets/products/trasera_negras.jpeg"],
        "Label #001": ["/assets/products/label_1.jpg", "/assets/products/label_2.jpeg", "/assets/products/trasera_negras.jpeg"],
        "MyCap": ["/assets/products/mycap_1.jpg", "/assets/products/mycap_2.jpeg", "/assets/products/trasera_negras.jpeg"],
        "Brown As": ["/assets/products/brown_1.jpg", "/assets/products/brown_2.jpeg", "/assets/products/trasera_blancas1.jpeg", "/assets/products/trasera_blancas2.jpeg"],
        "Everyday": ["/assets/products/everyday_1.jpg", "/assets/products/everyday_2.jpeg", "/assets/products/trasera_blancas1.jpeg", "/assets/products/trasera_blancas2.jpeg"],
        "Golden": ["/assets/products/golden_1.jpg", "/assets/products/golden_2.jpeg", "/assets/products/trasera_blancas1.jpeg", "/assets/products/trasera_blancas2.jpeg"],
        "Pause": ["/assets/products/pause_1.jpg", "/assets/products/pause_2.jpeg", "/assets/products/trasera_blancas1.jpeg", "/assets/products/trasera_blancas2.jpeg"],
    }

    # Seed products if empty
    product_count = db.query(ProductModel).count()
    if product_count == 0:
        bako_products = [
            ProductModel(nombre="Black As", precio=15000.00, stock=10, imagen_url="/assets/products/black_1.jpg", imagenes=IMAGE_MAP["Black As"]),
            ProductModel(nombre="Vibe", precio=15000.00, stock=10, imagen_url="/assets/products/vibe_1.jpg", imagenes=IMAGE_MAP["Vibe"]),
            ProductModel(nombre="Label #001", precio=15000.00, stock=10, imagen_url="/assets/products/label_1.jpg", imagenes=IMAGE_MAP["Label #001"]),
            ProductModel(nombre="MyCap", precio=15000.00, stock=10, imagen_url="/assets/products/mycap_1.jpg", imagenes=IMAGE_MAP["MyCap"]),
            ProductModel(nombre="Brown As", precio=15000.00, stock=10, imagen_url="/assets/products/brown_1.jpg", imagenes=IMAGE_MAP["Brown As"]),
            ProductModel(nombre="Everyday", precio=15000.00, stock=10, imagen_url="/assets/products/everyday_1.jpg", imagenes=IMAGE_MAP["Everyday"]),
            ProductModel(nombre="Golden", precio=15000.00, stock=10, imagen_url="/assets/products/golden_1.jpg", imagenes=IMAGE_MAP["Golden"]),
            ProductModel(nombre="Pause", precio=15000.00, stock=10, imagen_url="/assets/products/pause_1.jpg", imagenes=IMAGE_MAP["Pause"]),
        ]
        db.add_all(bako_products)
        db.commit()
        logger.info(f"Seeded {len(bako_products)} products.")
    else:
        # Update existing products with images if missing
        logger.info(f"{product_count} products found. Checking for missing images...")
        products = db.query(ProductModel).all()
        updated_count = 0
        for p in products:
            if not p.imagenes:
                fallback = [p.imagen_url] if p.imagen_url else []
                p.imagenes = IMAGE_MAP.get(p.nombre, fallback)
                updated_count += 1
        if updated_count > 0:
            db.commit()
            logger.info(f"Updated images for {updated_count} products.")
