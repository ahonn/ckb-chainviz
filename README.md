# CKB ChainViz

A real-time CKB blockchain data service providing WebSocket events and REST APIs for blockchain visualization and monitoring applications.

## 🌟 Features

- **Real-time Data Streaming**: WebSocket-based real-time blockchain events
- **Comprehensive REST API**: Full access to blocks, transactions, and chain state
- **Chain Synchronization**: Automatic synchronization with CKB network
- **Database Storage**: Persistent storage of blockchain data with Prisma ORM
- **Event-driven Architecture**: Decoupled event system for real-time updates
- **Multi-network Support**: Configurable for mainnet/testnet environments

## 🏗️ Architecture

This service acts as a generic, decoupled backend that:

- Connects to CKB network via RPC/WebSocket
- Synchronizes and stores blockchain data in SQLite database
- Provides real-time event streaming via WebSocket
- Exposes REST APIs for current state queries
- Supports any frontend visualization implementation

## 🚀 Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) 
- **Language**: TypeScript
- **Database**: SQLite with [Prisma](https://prisma.io/) ORM
- **Real-time**: Socket.IO for WebSocket connections
- **Blockchain**: [CKB Lumos](https://lumos-website.vercel.app/) SDK
- **Validation**: Joi for configuration validation
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- CKB node access (testnet/mainnet)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ckb-chainviz
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```bash
   # Database
   DATABASE_URL="file:./database.db"
   
   # CKB Network Configuration
   CKB_NETWORK_TYPE="testnet"  # or "mainnet"
   CKB_HTTP_RPC_URL="https://testnet.ckb.dev/"
   CKB_WS_RPC_URL="wss://testnet.ckb.dev/ws"
   
   # Optional: Server Configuration
   PORT=3000
   ```

4. **Initialize the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
pnpm run start:dev
```

### Production Mode
```bash
pnpm run build
pnpm run start:prod
```

### Debug Mode
```bash
pnpm run start:debug
```
