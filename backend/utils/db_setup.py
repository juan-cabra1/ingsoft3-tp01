from sqlalchemy import text, inspect
from logging_config import get_logger

logger = get_logger("db_setup")

def run_migrations(engine):
    """
    Auto-migrate: add new columns and tables if they don't exist (safe for existing data).
    This is a temporary solution until Alembic is set up.
    """
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    existing_product_columns = [col["name"] for col in inspector.get_columns("products")]

    with engine.connect() as conn:
        # ── Legacy column additions ──
        if "descripcion" not in existing_product_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN descripcion TEXT NULL"))
            logger.info("Added 'descripcion' column to products table.")
        if "detalle" not in existing_product_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN detalle TEXT NULL"))
            logger.info("Added 'detalle' column to products table.")

        # ── drops table ──
        if "drops" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE drops (
                    id INT NOT NULL AUTO_INCREMENT,
                    nombre VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    imagen_url VARCHAR(500) NULL,
                    orden INT NOT NULL DEFAULT 0,
                    activo BOOLEAN NOT NULL DEFAULT TRUE,
                    PRIMARY KEY (id)
                )
            """))
            logger.info("Created 'drops' table.")

        # ── subcategorias table ──
        if "subcategorias" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE subcategorias (
                    id INT NOT NULL AUTO_INCREMENT,
                    drop_id INT NOT NULL,
                    nombre VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL,
                    imagen_url VARCHAR(500) NULL,
                    orden INT NOT NULL DEFAULT 0,
                    PRIMARY KEY (id),
                    CONSTRAINT fk_sub_drop FOREIGN KEY (drop_id) REFERENCES drops(id) ON DELETE CASCADE
                )
            """))
            logger.info("Created 'subcategorias' table.")

        # ── New product columns ──
        # Re-read columns in case drops/subcategorias tables were just created
        existing_product_columns = [col["name"] for col in inspector.get_columns("products")]

        if "drop_id" not in existing_product_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN drop_id INT NULL"))
            # Add FK only if drops table now exists
            try:
                conn.execute(text(
                    "ALTER TABLE products ADD CONSTRAINT fk_product_drop "
                    "FOREIGN KEY (drop_id) REFERENCES drops(id) ON DELETE SET NULL"
                ))
            except Exception:
                pass  # FK may already exist or be unsupported in dev
            logger.info("Added 'drop_id' column to products table.")

        if "subcategoria_id" not in existing_product_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN subcategoria_id INT NULL"))
            try:
                conn.execute(text(
                    "ALTER TABLE products ADD CONSTRAINT fk_product_subcategoria "
                    "FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL"
                ))
            except Exception:
                pass
            logger.info("Added 'subcategoria_id' column to products table.")

        if "orden" not in existing_product_columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN orden INT NOT NULL DEFAULT 0"))
            logger.info("Added 'orden' column to products table.")

        # ── Indexes for drop/subcategoria lookups ──
        existing_product_indexes = {idx["name"] for idx in inspector.get_indexes("products")}
        if "idx_products_drop_id" not in existing_product_indexes:
            try:
                conn.execute(text("CREATE INDEX idx_products_drop_id ON products(drop_id)"))
                logger.info("Created index idx_products_drop_id.")
            except Exception:
                pass

        if "idx_products_subcategoria_id" not in existing_product_indexes:
            try:
                conn.execute(text("CREATE INDEX idx_products_subcategoria_id ON products(subcategoria_id)"))
                logger.info("Created index idx_products_subcategoria_id.")
            except Exception:
                pass

        if "drops" in existing_tables:
            existing_drop_indexes = {idx["name"] for idx in inspector.get_indexes("drops")}
            if "idx_drops_slug" not in existing_drop_indexes:
                try:
                    conn.execute(text("CREATE INDEX idx_drops_slug ON drops(slug)"))
                    logger.info("Created index idx_drops_slug.")
                except Exception:
                    pass

        if "subcategorias" in existing_tables:
            existing_sub_indexes = {idx["name"] for idx in inspector.get_indexes("subcategorias")}
            if "idx_subcategorias_drop_slug" not in existing_sub_indexes:
                try:
                    conn.execute(text("CREATE INDEX idx_subcategorias_drop_slug ON subcategorias(drop_id, slug)"))
                    logger.info("Created index idx_subcategorias_drop_slug.")
                except Exception:
                    pass

        conn.commit()
