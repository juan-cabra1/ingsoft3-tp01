"""
One-time migration: populate imagenes for existing products.
Run from backend directory: python migrate_imagenes.py
"""
import json
from database import SessionLocal
from models.product import ProductModel

# Map product names to their image arrays (from the old hardcoded data)
IMAGE_MAP = {
    "Black As": [
        "/assets/products/black_1.jpg",
        "/assets/products/black_2.jpeg",
        "/assets/products/trasera_negras.jpeg",
    ],
    "Vibe": [
        "/assets/products/vibe_1.jpg",
        "/assets/products/vibe_2.jpeg",
        "/assets/products/trasera_negras.jpeg",
    ],
    "Label #001": [
        "/assets/products/label_1.jpg",
        "/assets/products/label_2.jpeg",
        "/assets/products/trasera_negras.jpeg",
    ],
    "MyCap": [
        "/assets/products/mycap_1.jpg",
        "/assets/products/mycap_2.jpeg",
        "/assets/products/trasera_negras.jpeg",
    ],
    "Brown As": [
        "/assets/products/brown_1.jpg",
        "/assets/products/brown_2.jpeg",
        "/assets/products/trasera_blancas1.jpeg",
        "/assets/products/trasera_blancas2.jpeg",
    ],
    "Everyday": [
        "/assets/products/everyday_1.jpg",
        "/assets/products/everyday_2.jpeg",
        "/assets/products/trasera_blancas1.jpeg",
        "/assets/products/trasera_blancas2.jpeg",
    ],
    "Golden": [
        "/assets/products/golden_1.jpg",
        "/assets/products/golden_2.jpeg",
        "/assets/products/trasera_blancas1.jpeg",
        "/assets/products/trasera_blancas2.jpeg",
    ],
    "Pause": [
        "/assets/products/pause_1.jpg",
        "/assets/products/pause_2.jpeg",
        "/assets/products/trasera_blancas1.jpeg",
        "/assets/products/trasera_blancas2.jpeg",
    ],
}

def migrate():
    db = SessionLocal()
    try:
        products = db.query(ProductModel).all()
        for product in products:
            images = IMAGE_MAP.get(product.nombre, [])
            if not images and product.imagen_url:
                images = [product.imagen_url]
            product.imagenes = images
            print(f"  {product.nombre}: {len(images)} images")
        db.commit()
        print(f"\n✅ Migrated {len(products)} products.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
