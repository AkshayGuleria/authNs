#!/bin/bash

# Microsoft Entra AD Authentication Setup Script
# This script helps you get started quickly with the authentication demo

set -e

echo "🔐 Microsoft Entra AD Authentication Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js installed: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  Important: Edit .env.local with your Azure credentials:"
    echo ""
    echo "   1. Open .env.local in your editor"
    echo "   2. Replace the placeholder values with your Azure app details:"
    echo "      - VITE_AZURE_CLIENT_ID: Your Application ID"
    echo "      - VITE_AZURE_AUTHORITY: Your Azure authority URL"
    echo "      - VITE_AZURE_REDIRECT_URI: Your redirect URI"
    echo ""
    echo "   Need help? See LEARNING_GUIDE.md for detailed setup instructions"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Azure credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:5173/"
echo ""
echo "Documentation:"
echo "- Quick reference: Check README.md"
echo ""
