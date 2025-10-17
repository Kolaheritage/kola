#!/bin/bash

# Kola Heritage Platform Setup Script
# This script helps you set up the development environment

set -e

echo "🏛️ Kola Heritage Platform Setup"
echo "================================"
echo ""

# Check if Docker is installed
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "✅ Docker is installed"

# Check if Docker Compose is installed
echo "Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
echo "✅ Docker Compose is installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please update JWT_SECRET in .env for production use"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p database
touch backend/uploads/.gitkeep
echo "✅ Directories created"

# Create placeholder files if they don't exist
echo ""
echo "Setting up project structure..."

# Backend placeholder
if [ ! -f backend/src/server.js ]; then
    mkdir -p backend/src
    cat > backend/src/server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Heritage Platform API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
EOF
    echo "✅ Backend placeholder created"
fi

# Frontend placeholder
if [ ! -f frontend/src/App.js ]; then
    mkdir -p frontend/src frontend/public
    cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

    cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🏛️ Heritage Content Platform</h1>
      <p>Your Heritage Is Your Content</p>
      <p>Development environment is ready!</p>
    </div>
  );
}

export default App;
EOF

    cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Heritage Platform</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF
    echo "✅ Frontend placeholder created"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env file if needed"
echo "2. Run: docker-compose up"
echo "3. Access frontend at: http://localhost:3000"
echo "4. Access backend at: http://localhost:5000"
echo ""
echo "For more information, see README.md"
echo "================================"