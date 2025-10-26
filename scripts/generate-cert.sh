#!/bin/bash

# Generate self-signed SSL certificate for local development

CERTS_DIR="certs"
DAYS_VALID=365

echo "Generating self-signed SSL certificate..."

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

# Generate certificate
openssl req -x509 \
  -newkey rsa:4096 \
  -nodes \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -days $DAYS_VALID \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✓ Certificate generated successfully!"
echo "  • Key: $CERTS_DIR/key.pem"
echo "  • Cert: $CERTS_DIR/cert.pem"
echo "  • Valid for: $DAYS_VALID days"
