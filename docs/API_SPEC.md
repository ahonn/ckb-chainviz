# API Specification

## 1. Introduction

This document specifies the API for the CKB Data Service. The service is designed to be a generic, decoupled backend, providing factual blockchain data and events. It is not tied to any specific front-end visualization metaphor.

### Design Principles

- **State vs. Events**: The HTTP API provides the current **state** of any resource. The WebSocket API pushes real-time **state change events**.
- **Standardized Naming**: API endpoints and data fields use common blockchain terminology (e.g., `block`, `transaction`, `mempool`).
- **Atomicity**: Each event describes a minimal, self-contained state change.
- **Discoverability**: The API allows drilling down from high-level chain status to detailed transaction information.

---

## 2. WebSocket API

The WebSocket API provides real-time, incremental updates about the blockchain. It is ideal for live-updating user interfaces and monitoring tools.

### 2.1. Connection

- **Endpoint**: `ws://your-api-domain.com/` (or `wss://`)
- **Protocol**: Standard WebSocket protocol. All messages are in JSON format.

### 2.2. Communication Protocol

Clients manage subscriptions by sending messages to the server.

- **Client -> Server Message**:
  ```json
  {
    "action": "subscribe" | "unsubscribe",
    "channel": "chain" | "transactions"
  }
  ```

- **Server -> Client Message**:
  ```json
  {
    "channel": "chain" | "transactions",
    "type": "event.name",
    "payload": { ... }
  }
  ```

### 2.3. Channels and Events

#### Channel: `chain`
Provides macroscopic events about the blockchain's overall state.

- **Event: `block.finalized`**
  - **Description**: Fired when a new block is confirmed as part of the canonical chain. The payload includes summaries of all transactions confirmed in this block, making it ideal for real-time visualization without requiring follow-up API calls.
  - **Payload**:
    ```json
    {
      "blockNumber": "12345678",
      "blockHash": "0x...ffaa",
      "timestamp": "2023-10-27T10:00:00.000Z",
      "miner": "ckb...xxxx",
      "reward": "123456789",
      "transactionCount": 50,
      "proposalsCount": 120,
      "unclesCount": 1,
      "transactions": [
        {
          "txHash": "0x...txhash1",
          "fee": "10000",
          "size": "512",
          "cycles": "3000000"
        }
      ]
    }
    ```

- **Event: `chain.reorg`**
  - **Description**: Fired when a chain reorganization is detected. This is a critical event for clients to maintain data consistency.
  - **Payload**:
    ```json
    {
      "reorgDepth": 3,
      "newTip": {
        "blockNumber": "12345675",
        "blockHash": "0x...newtip"
      },
      "oldTip": {
        "blockNumber": "12345678",
        "blockHash": "0x...oldtip"
      }
    }
    ```

#### Channel: `transactions`
Provides fine-grained events about the lifecycle of individual transactions.

- **Event: `transaction.pending`**
  - **Description**: Fired when a transaction is first seen and enters the mempool (`pending` state). This marks the beginning of its lifecycle.
  - **Payload**:
    ```json
    {
      "txHash": "0x...abcd",
      "timestamp": "2023-10-27T10:00:05.123Z",
      "fee": "10000",
      "size": "512",
      "cycles": "3000000"
    }
    ```

- **Event: `transaction.proposed`**
  - **Description**: Fired when a transaction is included in a block's `proposals` set.
  - **Payload**:
    ```json
    {
      "txHash": "0x...abcd",
      "timestamp": "2023-10-27T10:00:10.456Z",
      "context": {
        "blockNumber": "12345678",
        "blockHash": "0x...ffaa"
      }
    }
    ```

- **Event: `transaction.confirmed`**
  - **Description**: Fired when a transaction is confirmed on-chain (i.e., its containing block is finalized). This marks the successful end of its lifecycle.
  - **Payload**:
    ```json
    {
      "txHash": "0x...abcd",
      "timestamp": "2023-10-27T10:00:18.789Z",
      "context": {
        "blockNumber": "12345678",
        "blockHash": "0x...ffaa",
        "txIndexInBlock": 12
      }
    }
    ```

- **Event: `transaction.rejected`**
  - **Description**: Fired when a transaction is explicitly rejected by the mempool.
  - **Payload**:
    ```json
    {
      "txHash": "0x...eeee",
      "timestamp": "2023-10-27T10:01:00.000Z",
      "reason": "Resolve-tx-failed: PoolIsFull"
    }
    ```

---

## 3. HTTP REST API

The HTTP REST API provides access to the current **state** of blockchain resources. It follows RESTful principles and returns JSON responses. All endpoints use standard HTTP status codes and support CORS for web applications.

### 3.1. Base URL

- **Endpoint**: `http://your-api-domain.com/api/` (or `https://`)
- **Content-Type**: `application/json`

### 3.2. Common Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1500
  }
}
```

For error responses:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Block not found"
  }
}
```

### 3.3. Block API

#### Get Latest Block
- **Endpoint**: `GET /api/blocks/latest`
- **Description**: Returns the most recent finalized block.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "blockNumber": "12345678",
      "blockHash": "0x...ffaa",
      "timestamp": "2023-10-27T10:00:00.000Z",
      "parentHash": "0x...eeff",
      "miner": "ckb...xxxx",
      "reward": "123456789",
      "transactionCount": 50,
      "proposalsCount": 120,
      "unclesCount": 1,
      "size": "2048000"
    }
  }
  ```

#### Get Block by Number
- **Endpoint**: `GET /api/blocks/:number`
- **Description**: Returns a specific block by its number.
- **Parameters**:
  - `number` (path): Block number (integer)
- **Response**: Same as latest block format

#### Get Block by Hash
- **Endpoint**: `GET /api/blocks/:hash`
- **Description**: Returns a specific block by its hash.
- **Parameters**:
  - `hash` (path): Block hash (hex string)
- **Response**: Same as latest block format

#### List Blocks
- **Endpoint**: `GET /api/blocks`
- **Description**: Returns a paginated list of blocks in descending order (newest first).
- **Query Parameters**:
  - `limit` (optional): Number of blocks to return (default: 20, max: 100)
  - `offset` (optional): Number of blocks to skip (default: 0)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "blockNumber": "12345678",
        "blockHash": "0x...ffaa",
        "timestamp": "2023-10-27T10:00:00.000Z",
        "transactionCount": 50,
        "size": "2048000"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 12345678
    }
  }
  ```

### 3.4. Transaction API

#### Get Transaction by Hash
- **Endpoint**: `GET /api/transactions/:hash`
- **Description**: Returns detailed information about a specific transaction.
- **Parameters**:
  - `hash` (path): Transaction hash (hex string)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "txHash": "0x...abcd",
      "status": "confirmed",
      "blockNumber": "12345678",
      "blockHash": "0x...ffaa",
      "txIndexInBlock": 12,
      "timestamp": "2023-10-27T10:00:18.789Z",
      "fee": "10000",
      "size": "512",
      "cycles": "3000000",
      "inputsCount": 2,
      "outputsCount": 3
    }
  }
  ```

#### List Transactions by Status
- **Endpoint**: `GET /api/transactions`
- **Description**: Returns a paginated list of transactions filtered by status.
- **Query Parameters**:
  - `status` (optional): Transaction status (`pending`, `proposed`, `confirmed`)
  - `limit` (optional): Number of transactions to return (default: 20, max: 100)
  - `offset` (optional): Number of transactions to skip (default: 0)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "txHash": "0x...abcd",
        "status": "confirmed",
        "timestamp": "2023-10-27T10:00:18.789Z",
        "fee": "10000",
        "size": "512",
        "cycles": "3000000"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 1500
    }
  }
  ```

#### Get Mempool Transactions
- **Endpoint**: `GET /api/transactions/mempool`
- **Description**: Returns all pending transactions in the mempool.
- **Query Parameters**:
  - `limit` (optional): Number of transactions to return (default: 50, max: 200)
  - `offset` (optional): Number of transactions to skip (default: 0)
- **Response**: Same format as transaction list

#### Get Block Transactions
- **Endpoint**: `GET /api/blocks/:blockNumber/transactions`
- **Description**: Returns all transactions in a specific block.
- **Parameters**:
  - `blockNumber` (path): Block number (integer)
- **Query Parameters**:
  - `limit` (optional): Number of transactions to return (default: 50, max: 200)
  - `offset` (optional): Number of transactions to skip (default: 0)
- **Response**: Same format as transaction list

---
*This document was generated by an AI coding assistant.* 
