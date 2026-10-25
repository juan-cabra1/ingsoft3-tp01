variable "image_repo_api" {
  type    = string
  default = "ghcr.io/juan-cabra1/ingsoft3-tp01-backend" # without the tag
}

variable "image_repo_front" {
  type    = string
  default = "ghcr.io/juan-cabra1/ingsoft3-tp01-frontend" # without the tag
}

# The image preprod runs: the commit of release v7.0.0. Changing it means recreating the services,
# because Render does not allow updating a free service (see decisiones.md).
variable "image_tag" {
  type    = string
  default = "sha-260d34364574798066828f2083157e0de4769732"
}

variable "region" {
  type    = string
  default = "oregon" # frankfurt | ohio | oregon | singapore | virginia
}

# --- Values that are NOT published: they come from a local, git-ignored *.tfvars file ---

variable "jwt_secret_key" {
  type      = string
  sensitive = true
}

variable "admin_default_password" {
  type      = string
  sensitive = true
}

variable "whatsapp_number" {
  type      = string
  sensitive = true
}
