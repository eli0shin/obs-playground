variable "project_name" {
  description = "Name prefix for the single preview host VM."
  type        = string
  default     = "obs-playground"
}

variable "instance_label" {
  description = "Vultr instance label."
  type        = string
  default     = "obs-playground"
}

variable "instance_hostname" {
  description = "Hostname assigned to the VM."
  type        = string
  default     = "obs-playground"
}

variable "instance_region" {
  description = "US-based Vultr region ID, for example ewr or atl."
  type        = string
}

variable "instance_plan" {
  description = "Vultr plan ID for the VM."
  type        = string
  default     = "vc2-2c-4gb"
}

variable "os_id" {
  description = "Vultr OS ID for the VM image."
  type        = number
  default     = 1743
}

variable "ssh_key_ids" {
  description = "SSH key IDs to install on the instance."
  type        = list(string)
  default     = []
}

variable "deploy_user" {
  description = "Linux user that receives deployment SSH access."
  type        = string
  default     = "obsdeploy"
}

variable "deploy_authorized_key" {
  description = "Public SSH key for the deployment user."
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Root DNS zone already purchased by the team. Leave empty to skip DNS management."
  type        = string
  default     = ""
}

variable "enable_dnssec" {
  description = "Whether to enable DNSSEC on the managed DNS zone."
  type        = bool
  default     = false
}

variable "preview_domain_label" {
  description = "Second-level label used for wildcard preview DNS entries."
  type        = string
  default     = "preview"
}

variable "enable_instance_backups" {
  description = "Whether Vultr automated instance backups should be enabled."
  type        = bool
  default     = false
}
