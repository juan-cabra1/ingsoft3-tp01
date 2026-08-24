"""
One-time migration: clear broken /uploads/... image paths from products.

Products created via the admin panel before the Cloudinary migration have
imagen_url and imagenes pointing to files that no longer exist on Railway's
ephemeral filesystem. This script resets those fields so the admin can
re-upload images through the panel.

Seeded products (/assets/...) are left untouched.

Run from the backend directory:
    python migrate_cloudinary.py
"""

from database import SessionLocal
from models.product import ProductModel


def migrate() -> None:
    db = SessionLocal()
    try:
        products = db.query(ProductModel).all()
        fixed = 0
        for p in products:
            has_broken_upload = p.imagen_url and p.imagen_url.startswith("/uploads/")
            if has_broken_upload:
                p.imagen_url = None
                p.imagenes = []
                fixed += 1
                print(f"  Cleared: {p.nombre} (id={p.id})")
        if fixed:
            db.commit()
        print(f"\nDone — cleared broken image paths for {fixed} product(s).")
        print("Re-upload their photos from the admin panel.")
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
