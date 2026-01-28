#!/bin/bash

# ♔ AI Chess Application - Automated Setup Script
# This script sets up the entire development environment

set -e

echo "======================================"
echo "♔ AI CHESS APPLICATION - SETUP"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version) found${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 14 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node $(node --version) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version) found${NC}"

echo ""

# BACKEND SETUP
echo -e "${YELLOW}Setting up backend...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}backend directory not found. Creating...${NC}"
    mkdir -p backend
fi

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Setup .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and add your OPENAI_API_KEY${NC}"
    echo "OPENAI_API_KEY=sk-your-api-key-here"
else
    echo ".env file already exists"
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

cd ..

echo ""

# FRONTEND SETUP
echo -e "${YELLOW}Setting up frontend...${NC}"

if [ ! -d "frontend" ]; then
    echo "Creating frontend directory..."
    mkdir -p frontend
fi

cd frontend

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "npm dependencies already installed"
fi

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

cd ..

echo ""
echo -e "${GREEN}======================================"
echo "✓ Setup Complete!"
echo "=====================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure OpenAI API Key:"
echo -e "   ${YELLOW}nano backend/.env${NC} or ${YELLOW}vim backend/.env${NC}"
echo "   Add: OPENAI_API_KEY=sk-your-api-key-here"
echo ""
echo "2. Start Backend (Terminal 1):"
echo -e "   ${YELLOW}cd backend${NC}"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo -e "   ${YELLOW}venv\\Scripts\\activate${NC}"
else
    echo -e "   ${YELLOW}source venv/bin/activate${NC}"
fi
echo -e "   ${YELLOW}python app.py${NC}"
echo ""
echo "3. Start Frontend (Terminal 2):"
echo -e "   ${YELLOW}cd frontend${NC}"
echo -e "   ${YELLOW}npm start${NC}"
echo ""
echo "4. Open Browser:"
echo -e "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "Backend API: http://localhost:5000/api"
echo ""
