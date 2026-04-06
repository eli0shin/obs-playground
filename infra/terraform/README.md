# HCP Terraform Bootstrap

This repo uses HCP Terraform to provision the single Vultr VM and related firewall/DNS resources, and GitHub Actions reads the resulting workspace outputs before deploying app containers. Sources: `../.github/workflows/terraform-plan.yml`, `../.github/workflows/terraform-apply.yml`, `../.github/workflows/deploy.yml`, `../.github/workflows/preview.yml`, `./terraform/outputs.tf`

## Exact Setup

1. In HCP Terraform, create one workspace for this repo's infrastructure.
   Use an `API-driven` workspace and set the workspace working directory to `terraform`. The GitHub workflows upload the `./infra` directory, and the Terraform config itself lives under `infra/terraform`. Sources: `../.github/workflows/terraform-plan.yml`, `../.github/workflows/terraform-apply.yml`, `./terraform/main.tf`, `https://developer.hashicorp.com/terraform/cloud-docs/workspaces/settings#terraform-working-directory`

2. In that HCP workspace, add these variables.
   Environment variables:

- `VULTR_API_KEY=<your Vultr API key>`

Terraform variables:

- `instance_region="ewr"` or another US Vultr region ID
- `deploy_authorized_key="ssh-ed25519 AAAA..."`

Optional Terraform variables:

- `domain_name="yourdomain.com"`
- `instance_plan="vc2-2c-4gb"`
- `enable_dnssec=false`
- `enable_instance_backups=false`
- `deploy_user="obsdeploy"`

`VULTR_API_KEY` is how the Vultr provider authenticates, and `instance_region` plus `deploy_authorized_key` are the required infra inputs in this repo. Sources: `./terraform/variables.tf`, `./terraform/providers.tf`, `https://docs.vultr.com/reference/terraform`

3. Generate the SSH keypair used by deployments if you do not already have one.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/obsdeploy
```

Put the public key in the HCP Terraform variable `deploy_authorized_key`, and keep the private key for the GitHub secret `DEPLOY_SSH_KEY`. Sources: `./terraform/variables.tf`, `../cloud-init/user-data.yaml`, `../.github/workflows/deploy.yml`, `../.github/workflows/preview.yml`

4. Decide how DNS will work before the first apply.
   If your domain's authoritative DNS will be hosted in Vultr, set `domain_name` in the HCP workspace and Terraform will create:

- `app.<domain>`
- `custom.<domain>`
- `tanstack.<domain>`
- `*.preview.<domain>`

If your domain stays with another DNS provider, leave `domain_name` unset or empty and create those four records manually after the VM is provisioned. Sources: `./terraform/main.tf`, `./terraform/variables.tf`, `./terraform/outputs.tf`

5. In GitHub, add these repository variables.

- `TF_CLOUD_ORGANIZATION`
- `TF_WORKSPACE_INFRA`

Add these repository secrets.

- `TF_API_TOKEN`
- `DEPLOY_SSH_KEY`
- `DEPLOY_BASE_DOMAIN`
- `ACME_EMAIL`
- `DD_API_KEY`
- `DD_SITE`
- `HONEYCOMB_ENDPOINT`
- `HONEYCOMB_API_KEY`
- `GRAFANA_OTLP_ENDPOINT`
- `GRAFANA_OTLP_AUTH`
- `SENTRY_OTLP_ENDPOINT`
- `SENTRY_AUTH`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_STATSIG_CLIENT_KEY`
- `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`
- `NEXT_PUBLIC_DATADOG_APP_ID`
- `VITE_DATADOG_CLIENT_TOKEN`
- `VITE_DATADOG_APP_ID`

The Terraform workflows use `TF_CLOUD_ORGANIZATION`, `TF_WORKSPACE_INFRA`, and `TF_API_TOKEN`; the deploy workflows use the rest. Sources: `../.github/workflows/terraform-plan.yml`, `../.github/workflows/terraform-apply.yml`, `../.github/workflows/deploy.yml`, `../.github/workflows/preview.yml`

6. Trigger infrastructure once.
   Push a change under `infra/**` to run `Terraform Apply` on `main`, or run that workflow manually if you prefer. That workflow uploads the `infra` directory to HCP Terraform and creates/applies the run in the configured workspace. Source: `../.github/workflows/terraform-apply.yml`

7. Confirm the workspace outputs exist after apply.
   You should see at least:

- `instance_main_ip`
- `deploy_user`

The app deploy workflows read those outputs from HCP Terraform before they SSH to the host. Sources: `./terraform/outputs.tf`, `../.github/workflows/deploy.yml`, `../.github/workflows/preview.yml`, `https://github.com/hashicorp/tfc-workflows-github/blob/main/actions/README.md`

8. Merge to `main` for app deploys and open same-repo PRs for preview deploys.
   Main deploys and preview deploys are both gated on the `CI` workflow succeeding first. Sources: `../.github/workflows/deploy.yml`, `../.github/workflows/preview.yml`, `../.github/workflows/ci.yml`

## Minimal Vultr Setup

You do not need to pre-create a VM, firewall, or DNS records in the Vultr UI for this repo. Terraform creates the firewall group, firewall rules, the VM, and optionally the DNS zone and records from the HCP workspace run. Sources: `./terraform/main.tf`, `https://docs.vultr.com/reference/terraform`

The only Vultr prerequisite assumed here is:

- you already have a Vultr account
- you already have a Vultr API key

Put that key into the HCP Terraform workspace as the environment variable `VULTR_API_KEY`. Sources: `./terraform/providers.tf`, `https://docs.vultr.com/reference/terraform`
