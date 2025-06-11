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

- **Endpoint**: `ws://localhost:3000/` (or `wss://` for production)
- **Protocol**: Socket.IO protocol with JSON messages.

### 2.2. Communication Protocol

Clients manage subscriptions by sending messages to the server using Socket.IO events.

- **Client -> Server Message**:
  ```json
  // Emit on 'message' event
  {
    "action": "subscribe" | "unsubscribe",
    "channel": "chain" | "transactions"
  }
  ```

- **Server -> Client Messages**:
  - **Subscription confirmations**:
    ```json
    // Received on 'subscribed' event
    {
      "channel": "chain" | "transactions"
    }
    
    // Received on 'unsubscribed' event
    {
      "channel": "chain" | "transactions"
    }
    ```
  
  - **Data events**:
    ```json
    // Received on 'message' event
    {
      "channel": "chain" | "transactions",
      "type": "event.name",
      "payload": { ... }
    }
    ```

  - **Error messages**:
    ```json
    // Received on 'error' event
    {
      "message": "Error description"
    }
    ```

### 2.3. Channels and Events

#### Channel: `chain`
Provides macroscopic events about the blockchain's overall state.

- **Event: `block.finalized`**
  - **Description**: Fired when a new block is confirmed as part of the canonical chain. The payload includes summaries of all transactions confirmed in this block, making it ideal for real-time updates without requiring follow-up API calls.
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
          "txHash": "0x...txhash1"
        }
      ]
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

The HTTP REST API provides access to the current state of blockchain resources. It follows RESTful conventions and returns JSON responses.

### 3.1. Base URL

- **Base URL**: `http://localhost:3000/api/v1` (development)
- **Content-Type**: All requests and responses use `application/json`
- **CORS**: Enabled for all origins (should be restricted in production)

### 3.2. Block Endpoints

#### 3.2.1. Get Latest Block

Retrieves the most recent block information.

- **Endpoint**: `GET /api/v1/blocks/latest`
- **Description**: Returns the latest confirmed block with basic information.

**Response:**
```json
{
  "data": {
    "blockNumber": "12345678",
    "blockHash": "0x...ffaa",
    "timestamp": "2023-10-27T10:00:00.000Z",
    "transactionCount": 45,
    "totalFees": "2500000"
  }
}
```

**Example Request:**
```
GET /api/v1/blocks/latest
```

#### 3.2.2. Get Block by Number

Retrieves detailed information for a specific block.

- **Endpoint**: `GET /api/v1/blocks/{blockNumber}`
- **Description**: Returns detailed information for the specified block, including all transactions.
- **Parameters**:
  - `blockNumber` (path): Block number as a string of digits

**Response:**
```json
{
  "data": {
    "blockNumber": "12345678",
    "blockHash": "0x...ffaa",
    "timestamp": "2023-10-27T10:00:00.000Z",
    "miner": "ckb...xxxx",
    "transactionCount": 45,
    "transactions": [
      {
        "txHash": "0x...abc",
        "fee": "10000",
        "feeRate": "19.53",
        "size": "512"
      }
    ]
  }
}
```

**Example Request:**
```
GET /api/v1/blocks/12345678
```

### 3.3. Transaction Endpoints

#### 3.3.1. Get Transaction Details

Retrieves detailed information for a specific transaction.

- **Endpoint**: `GET /api/v1/transactions/{txHash}`
- **Description**: Returns complete transaction information including inputs, outputs, and current status.
- **Parameters**:
  - `txHash` (path): Transaction hash as a hex string starting with 0x

**Response:**
```json
{
  "data": {
    "txHash": "0x...abcd",
    "status": "pending",
    "timestamp": "2023-10-27T10:00:05.123Z",
    "fee": "10000",
    "feeRate": "19.53",
    "size": "512",
    "cycles": "3000000",
    "inputs": [
      {
        "previousOutput": {
          "txHash": "0x...prev",
          "index": "0"
        },
        "since": "0x0"
      }
    ],
    "outputs": [
      {
        "capacity": "50000000000",
        "lock": {
          "codeHash": "0x...lock",
          "hashType": "type",
          "args": "0x..."
        }
      }
    ]
  }
}
```

**Transaction Status Values:**
- `pending`: Transaction is in mempool but not yet proposed
- `proposed`: Transaction is included in a block's proposals
- `confirmed`: Transaction is confirmed on-chain

**Example Request:**
```
GET /api/v1/transactions/0x...abcd
```

### 3.4. System Endpoints

#### 3.4.1. Get Current Snapshot

Retrieves a complete snapshot of the current blockchain state for initial page loading.

- **Endpoint**: `GET /api/v1/snapshot`
- **Description**: Returns the current state including latest block, pending transactions, and proposed transactions in a single request for efficient initial page loading.

**Response:**
```json
{
  "data": {
    "latestBlock": {
      "blockNumber": "12345678",
      "blockHash": "0x...ffaa",
      "timestamp": "2023-10-27T10:00:00.000Z",
      "transactionCount": 45
    },
    "pendingTransactions": [
      {
        "txHash": "0x...abc",
        "timestamp": "2023-10-27T10:00:05.123Z",
        "fee": "10000",
        "feeRate": "19.53",
        "size": "512"
      }
    ],
    "proposedTransactions": [
      {
        "txHash": "0x...def",
        "timestamp": "2023-10-27T10:00:10.456Z",
        "fee": "15000",
        "feeRate": "22.06",
        "size": "680",
        "context": {
          "blockNumber": "12345678",
          "blockHash": "0x...ffaa"
        }
      }
    ]
  },
  "timestamp": "2023-10-27T10:00:20.000Z"
}
```

**Example Request:**
```
GET /api/v1/snapshot
```

### 3.5. Response Format

#### 3.5.1. Success Response Structure

All successful API responses follow this structure:

- `data`: The main payload containing the requested resource(s)
- `timestamp` (for snapshot endpoint): Server timestamp when response was generated

#### 3.5.2. Error Response Structure

Error responses are handled by a global exception filter and follow this structure:

```json
{
  "statusCode": 404,
  "message": "Block 12345678 not found",
  "timestamp": "2023-10-27T10:00:20.000Z",
  "path": "/api/v1/blocks/12345678"
}
```

#### 3.5.3. HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters (e.g., invalid block number format, invalid transaction hash format)
- `404 Not Found`: Resource not found (e.g., block or transaction not found)
- `500 Internal Server Error`: Server error
