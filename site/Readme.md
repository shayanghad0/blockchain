# Blockchain Dashboard

A real-time blockchain simulation dashboard built with Node.js, Vite, React, and TypeScript.

## Features

- Simulates a simple blockchain with proof‑of‑work (difficulty 1)
- Generates random transactions and mines blocks continuously
- Broadcasts the full state via WebSocket every 10 ms
- Displays:
  - Statistics (blocks, transactions, pending, difficulty, reward)
  - All transactions (confirmed + pending)
  - Successful (confirmed) transactions
  - Pending transactions
  - List of blocks

## How to Run

### Prerequisites
- Node.js 18 or later
- npm or yarn

### Backend

```bash
cd backend
npm install
npm run dev   # uses ts-node for development
```

The backend will start on `http://localhost:3001`.

### Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

Open your browser and go to `http://localhost:5173` to see the dashboard.

## How it Works

The backend maintains a blockchain in memory. It:
- Generates 1–3 random transactions every second.
- Mines a new block (proof‑of‑work with difficulty 1) to include those transactions plus a mining reward.
- Broadcasts the full blockchain state (chain, pending transactions) to all connected WebSocket clients every 10 ms.

The frontend receives the state and updates the UI accordingly.

## Configuration

- **Mining Difficulty**: Change `difficulty` in `backend/src/index.ts` (default 1). A higher value will make mining slower.
- **Mining Reward**: Change `miningReward` (default 50).
- **Update Interval**: The broadcast interval is set to 10 ms in `backend/src/index.ts` (you can adjust).
- **Block Generation Interval**: After mining, the backend waits 1000 ms before the next cycle. Adjust `setTimeout` in `runSimulation`.

## Note

This is a simulation for educational purposes. It does not implement real cryptographic signatures or network consensus.
```

---

## Final Thoughts

This solution provides a complete, working project that meets the requirements:

- Backend in Node.js with Express and WebSocket.
- Frontend with Vite + React + TypeScript.
- Real-time updates every 10 ms (as close as practical to the requested "0.01ms").
- Displays all transactions, successful transactions, pending transactions, and blocks.

You can run both parts simultaneously and watch the blockchain grow in real time.