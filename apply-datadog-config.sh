#!/bin/bash

# Script to apply the fixed Datadog configuration
# This fixes the OTLP trace forwarding issue by removing deprecated span_name_remappings

set -e  # Exit on any error

echo "========================================"
echo "Applying Fixed Datadog Configuration"
echo "========================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Error: This script must be run with sudo"
   echo "Usage: sudo ./apply-datadog-config.sh"
   exit 1
fi

# Verify source file exists
if [ ! -f "./datadog.yaml" ]; then
    echo "Error: datadog.yaml not found in current directory"
    exit 1
fi

# Backup the current config
BACKUP_FILE="/opt/datadog-agent/etc/datadog.yaml.backup-$(date +%Y%m%d-%H%M%S)"
echo "1. Creating backup of current config..."
cp /opt/datadog-agent/etc/datadog.yaml "$BACKUP_FILE"
echo "   Backup saved to: $BACKUP_FILE"
echo ""

# Copy the new config
echo "2. Installing new configuration..."
cp ./datadog.yaml /opt/datadog-agent/etc/datadog.yaml
chown root:admin /opt/datadog-agent/etc/datadog.yaml
chmod 644 /opt/datadog-agent/etc/datadog.yaml
echo "   Configuration installed"
echo ""

# Restart the agent
echo "3. Restarting Datadog Agent..."
launchctl stop com.datadoghq.agent
sleep 2
launchctl start com.datadoghq.agent
echo "   Agent restarted"
echo ""

# Wait for agent to start
echo "4. Waiting for agent to initialize (10 seconds)..."
sleep 10
echo ""

# Check agent status
echo "5. Checking agent status..."
/opt/datadog-agent/bin/agent/agent status | grep -A 3 "OTLP"
echo ""

echo "========================================"
echo "Configuration applied successfully!"
echo "========================================"
echo ""
