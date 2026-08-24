"""
Admin product management endpoints — protected by JWT.
"""

import os
import uuid
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from models.product import Product, ProductCreate, ProductUpdate
from models.drop import Drop, DropCreate, DropUpdate, Subcategoria, SubcategoriaCreate, SubcategoriaUpdate, ReorderRequest
from services.product_service import ProductService
from services.drop_service import DropService
from dependencies.auth import get_current_admin
from database import get_db
from middleware.metrics import log_admin_action
from config import get_settings

router = APIRouter(prefix="/admin", tags=["admin"])

# Upload config
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "products")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    admin: str = Depends(get_current_admin),
):
    """
    Upload a product image. Returns the URL path to use in product data.
    Accepts JPEG, PNG, WebP up to 5 MB.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Usa JPEG, PNG o WebP.",
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="La imagen no puede superar los 5 MB.",
        )

    settings = get_settings()

    if settings.cloudinary_enabled:
        # Import lazily so a missing package doesn't crash the app at startup
        import cloudinary  # noqa: PLC0415
        import cloudinary.uploader  # noqa: PLC0415

        # Upload to Cloudinary — returns a permanent, CDN-backed URL
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )
        result = cloudinary.uploader.upload(
            BytesIO(contents),
            folder="bako-products",
            public_id=uuid.uuid4().hex,
            resource_type="image",
        )
        return {"url": result["secure_url"]}

    # Fallback: save to local filesystem (development only)
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filepath = os.path.join(UPLOAD_DIR, unique_name)
    with open(filepath, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/products/{unique_name}"}


@router.get("/products", response_model=List[Product])
def get_all_products(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all products (admin view)."""
    return ProductService.get_all_products(db)


@router.post("/products", response_model=Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new product."""
    created = ProductService.create_product(db, product)
    log_admin_action("create", admin, created.id, f"name={created.nombre}")
    return created


@router.put("/products/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_products(
    body: ReorderRequest,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reorder products by providing full ordered list of IDs."""
    ProductService.reorder_products(db, body.ordered_ids)
    return None


@router.put("/products/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    product: ProductUpdate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing product."""
    updated = ProductService.update_product(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    log_admin_action("update", admin, product_id)
    return updated


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a product."""
    deleted = ProductService.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    log_admin_action("delete", admin, product_id)
    return None


# ──────────────────── Admin: Drops ────────────────────

@router.get("/drops", response_model=List[Drop])
def admin_get_drops(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all drops (including inactive) for admin view."""
    return DropService.get_all_drops(db)


@router.post("/drops", response_model=Drop, status_code=status.HTTP_201_CREATED)
def admin_create_drop(
    drop: DropCreate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new drop."""
    created = DropService.create_drop(db, drop)
    log_admin_action("create_drop", admin, created.id, f"name={created.nombre}")
    return created


@router.put("/drops/reorder", status_code=status.HTTP_204_NO_CONTENT)
def admin_reorder_drops(
    body: ReorderRequest,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reorder drops by providing full ordered list of IDs."""
    DropService.reorder_drops(db, body.ordered_ids)
    return None


@router.put("/drops/{drop_id}", response_model=Drop)
def admin_update_drop(
    drop_id: int,
    drop: DropUpdate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing drop."""
    updated = DropService.update_drop(db, drop_id, drop)
    if not updated:
        raise HTTPException(status_code=404, detail="Drop no encontrado")
    log_admin_action("update_drop", admin, drop_id)
    return updated


@router.delete("/drops/{drop_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_drop(
    drop_id: int,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a drop (products are kept but unassigned)."""
    deleted = DropService.delete_drop(db, drop_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Drop no encontrado")
    log_admin_action("delete_drop", admin, drop_id)
    return None


# ──────────────────── Admin: Subcategorias ────────────────────

@router.get("/drops/{drop_id}/subcategorias", response_model=List[Subcategoria])
def admin_get_subcategorias(
    drop_id: int,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get subcategorias for a drop."""
    return DropService.get_subcategorias(db, drop_id)


@router.post(
    "/drops/{drop_id}/subcategorias",
    response_model=Subcategoria,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_subcategoria(
    drop_id: int,
    sub: SubcategoriaCreate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a subcategoria within a drop."""
    drop = DropService.get_drop_by_id(db, drop_id)
    if not drop:
        raise HTTPException(status_code=404, detail="Drop no encontrado")
    created = DropService.create_subcategoria(db, drop_id, sub)
    log_admin_action("create_subcategoria", admin, created.id, f"drop={drop_id}")
    return created


@router.put(
    "/drops/{drop_id}/subcategorias/reorder",
    status_code=status.HTTP_204_NO_CONTENT,
)
def admin_reorder_subcategorias(
    drop_id: int,
    body: ReorderRequest,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reorder subcategorias within a drop."""
    DropService.reorder_subcategorias(db, drop_id, body.ordered_ids)
    return None


@router.put("/subcategorias/{sub_id}", response_model=Subcategoria)
def admin_update_subcategoria(
    sub_id: int,
    sub: SubcategoriaUpdate,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a subcategoria."""
    updated = DropService.update_subcategoria(db, sub_id, sub)
    if not updated:
        raise HTTPException(status_code=404, detail="Subcategoría no encontrada")
    log_admin_action("update_subcategoria", admin, sub_id)
    return updated


@router.delete("/subcategorias/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_subcategoria(
    sub_id: int,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a subcategoria (products kept but unassigned from subcategoria)."""
    deleted = DropService.delete_subcategoria(db, sub_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subcategoría no encontrada")
    log_admin_action("delete_subcategoria", admin, sub_id)
    return None

