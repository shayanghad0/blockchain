import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import { Blockchain, Wallet, Transaction } from './blockchain';
import { BlockchainState } from './types';

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize blockchain with difficulty 1 for fast mining
const blockchain = new Blockchain(1, 50);

// Create a pool of wallets
const wallets: Wallet[] = [];
for (let i = 0; i < 5; i++) {
  wallets.push(new Wallet());
}
console.log('Wallets created:');
wallets.forEach((w, i) => console.log(`  Wallet ${i}: ${w.address.slice(0, 10)}...`));

// Broadcast state to all connected clients
function broadcastState() {
  const state = blockchain.getState();
  const data = JSON.stringify(state);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Generate random transactions and mine blocks continuously
async function runSimulation() {
  let txCount = 0;
  while (true) {
    // Generate 1-3 random transactions
    const numTx = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numTx; i++) {
      const sender = wallets[Math.floor(Math.random() * wallets.length)];
      let recipient = wallets[Math.floor(Math.random() * wallets.length)];
      while (recipient === sender) {
        recipient = wallets[Math.floor(Math.random() * wallets.length)];
      }
      const amount = Math.floor(Math.random() * 100) + 1;
      const tx = new Transaction(sender.address, recipient.address, amount);
      tx.signature = sender.sign(tx.calculateHash());
      blockchain.addTransaction(tx);
      console.log(`New transaction: ${sender.address.slice(0, 8)}... -> ${recipient.address.slice(0, 8)}... : ${amount} coins`);
    }

    // Mine pending transactions (reward to random wallet)
    const miner = wallets[Math.floor(Math.random() * wallets.length)];
    blockchain.minePendingTransactions(miner.address);

    // Broadcast updated state immediately after mining
    broadcastState();

    // Wait a bit before next block (mining itself takes some time)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Start simulation (non-blocking)
runSimulation().catch(console.error);

// Also broadcast at high frequency (every 10ms) to satisfy the requirement
setInterval(() => {
  broadcastState();
}, 10);

// Basic HTTP endpoint to get state
app.get('/api/state', (req, res) => {
  res.json(blockchain.getState());
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});