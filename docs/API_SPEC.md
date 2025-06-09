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

The HTTP API provides access to the current state and historical data of all blockchain resources.

### 3.1. General Conventions

- **Base URL**: `/api/v1`
- **Success Response**: All successful `GET` requests return `200 OK` with a body of `{ "data": ... }`.
- **Pagination**: Collection endpoints return a `pagination` object: `{ "total": 1234, "limit": 100, "page": 1 }`.
- **Data Types**: All hashes and large integers (e.g., `u64`, `u128`, `capacity`) are returned as strings.

### 3.2. Endpoints

#### Chain

- **`GET /chain/info`**
  - **Description**: Retrieves current, high-level information about the blockchain.
  - **Response**:
    ```json
    {
      "data": {
        "chain": "ckb_testnet",
        "tipBlockNumber": "12345678",
        "tipBlockHash": "0x...ffaa",
        "epoch": "3000.123.1024",
        "difficulty": "0x123abc...",
        "medianTime": "2023-10-27T09:59:50.000Z"
      }
    }
    ```

#### Mempool

- **`GET /mempool/info`**
  - **Description**: Retrieves statistics about the transaction mempool.
  - **Response**:
    ```json
    {
      "data": {
        "pendingCount": 1234,
        "proposedCount": 2345,
        "totalSizeKb": 8192,
        "totalCycles": "150000000000",
        "minFeeRate": "1000"
      }
    }
    ```

- **`GET /mempool/transactions`**
  - **Description**: Retrieves a list of transactions currently in the mempool.
  - **Query Parameters**:
    - `status=pending|proposed` (defaults to all)
    - `limit=100`
    - `page=1`
  - **Response**: `{ "data": [ ... ], "pagination": { ... } }` where each object in `data` is a transaction summary.

#### Blocks

- **`GET /blocks`**
  - **Description**: Retrieves a paginated list of the most recent blocks, ordered by block number descending.
  - **Query Parameters**: `limit=20`, `

---
*This document was generated by an AI coding assistant.* 