output "instance_main_ip" {
  description = "Public IPv4 address of the single preview host VM."
  value       = vultr_instance.preview_host.main_ip
}

output "instance_id" {
  description = "Vultr instance ID for the preview host VM."
  value       = vultr_instance.preview_host.id
}

output "managed_domain" {
  description = "Managed DNS domain, if DNS resources are enabled."
  value       = local.dns_enabled ? vultr_dns_domain.preview_host[0].domain : null
}

output "main_hosts" {
  description = "Primary hostnames expected by the deployment."
  value = local.dns_enabled ? {
    app      = "app.${var.domain_name}"
    custom   = "custom.${var.domain_name}"
    tanstack = "tanstack.${var.domain_name}"
    preview  = "*.${var.preview_domain_label}.${var.domain_name}"
  } : null
}
