terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0" # pinned: the repo is archived, the official provider will use another source
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

provider "neon" {}   # reads NEON_API_KEY
provider "render" {} # reads RENDER_API_KEY and RENDER_OWNER_ID

# --- The preprod Neon project: it does not exist until this is applied ---

resource "neon_project" "preprod" {
  name = "bako-preprod"

  # Pinned on purpose: left unset, the provider picked us-east-2 on the first apply and us-east-1 on the
  # next one. Same region as the QA and PROD projects.
  region_id = "aws-us-east-1"

  # The provider asks for 86400 s of history by default and the free plan caps it at 21600.
  # Without this line the first apply fails.
  history_retention_seconds = 21600
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "bako_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "bako_preprod"
  owner_name = neon_role.preprod.name
}

# --- The two preprod services: they run the image published by the TP7 pipeline ---

locals {
  # The connection string is BUILT here from what Neon returned. Nobody copies and pastes it.
  # Direct host (not the pooler), same as QA and PROD: the app has its own SQLAlchemy pool.
  database_url = "postgresql://${neon_role.preprod.name}:${urlencode(neon_role.preprod.password)}@${neon_project.preprod.database_host}/${neon_database.preprod.name}?sslmode=require"
}

resource "render_web_service" "api" {
  name   = "bako-api-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_api # without the tag
      tag       = var.image_tag
    }
  }

  health_check_path = "/health"

  # COMMIT_SHA is deliberately not declared: the image already carries the commit it was built from,
  # and a service variable would override it.
  env_vars = {
    DATABASE_URL           = { value = local.database_url }
    JWT_SECRET_KEY         = { value = var.jwt_secret_key }
    ADMIN_DEFAULT_PASSWORD = { value = var.admin_default_password }
    WHATSAPP_NUMBER        = { value = var.whatsapp_number }
    ENVIRONMENT            = { value = "preprod" }
    PORT                   = { value = "8000" }
  }
}

resource "render_web_service" "front" {
  name   = "bako-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    BACKEND_URL  = { value = render_web_service.api.url } # derived from the api, not copied
    DNS_RESOLVER = { value = "8.8.8.8" }
  }
}
