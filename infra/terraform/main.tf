locals {
  dns_enabled = trim(var.domain_name) != ""
}

resource "vultr_firewall_group" "preview_host" {
  description = "${var.project_name} ingress firewall"
}

resource "vultr_firewall_rule" "ssh" {
  firewall_group_id = vultr_firewall_group.preview_host.id
  protocol          = "tcp"
  ip_type           = "v4"
  subnet            = "0.0.0.0"
  subnet_size       = 0
  port              = "22"
  notes             = "SSH"
}

resource "vultr_firewall_rule" "http" {
  firewall_group_id = vultr_firewall_group.preview_host.id
  protocol          = "tcp"
  ip_type           = "v4"
  subnet            = "0.0.0.0"
  subnet_size       = 0
  port              = "80"
  notes             = "HTTP"
}

resource "vultr_firewall_rule" "https" {
  firewall_group_id = vultr_firewall_group.preview_host.id
  protocol          = "tcp"
  ip_type           = "v4"
  subnet            = "0.0.0.0"
  subnet_size       = 0
  port              = "443"
  notes             = "HTTPS"
}

resource "vultr_instance" "preview_host" {
  plan              = var.instance_plan
  region            = var.instance_region
  os_id             = var.os_id
  label             = var.instance_label
  hostname          = var.instance_hostname
  firewall_group_id = vultr_firewall_group.preview_host.id
  ssh_key_ids       = var.ssh_key_ids
  backups           = var.enable_instance_backups ? "enabled" : "disabled"
  activation_email  = false
  user_data = templatefile("${path.module}/../cloud-init/user-data.yaml", {
    deploy_user           = var.deploy_user
    deploy_authorized_key = trimspace(var.deploy_authorized_key)
  })
  tags = [
    var.project_name,
    "preview-host",
    "us-region",
  ]
}

resource "vultr_dns_domain" "preview_host" {
  count   = local.dns_enabled ? 1 : 0
  domain  = var.domain_name
  ip      = vultr_instance.preview_host.main_ip
  dns_sec = var.enable_dnssec ? "enabled" : "disabled"
}

resource "vultr_dns_record" "app" {
  count  = local.dns_enabled ? 1 : 0
  domain = vultr_dns_domain.preview_host[0].id
  name   = "app"
  type   = "A"
  data   = vultr_instance.preview_host.main_ip
  ttl    = 300
}

resource "vultr_dns_record" "custom" {
  count  = local.dns_enabled ? 1 : 0
  domain = vultr_dns_domain.preview_host[0].id
  name   = "custom"
  type   = "A"
  data   = vultr_instance.preview_host.main_ip
  ttl    = 300
}

resource "vultr_dns_record" "tanstack" {
  count  = local.dns_enabled ? 1 : 0
  domain = vultr_dns_domain.preview_host[0].id
  name   = "tanstack"
  type   = "A"
  data   = vultr_instance.preview_host.main_ip
  ttl    = 300
}

resource "vultr_dns_record" "preview_wildcard" {
  count  = local.dns_enabled ? 1 : 0
  domain = vultr_dns_domain.preview_host[0].id
  name   = "*.${var.preview_domain_label}"
  type   = "A"
  data   = vultr_instance.preview_host.main_ip
  ttl    = 300
}
