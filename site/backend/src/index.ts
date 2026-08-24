import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { Blockchain, Wallet, Transaction, Block } from './blockchain';
import { BlockchainState } from './types';
import { TerminalUI } from './terminal-ui';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const DIFFICULTY = parseInt(process.env.DIFFICULTY || '1', 10);
const MINING_REWARD = parseFloat(process.env.MINING_REWARD || '50');
const BLOCK_INTERVAL_MS = parseInt(process.env.BLOCK_INTERVAL_MS || '1000', 10);
const SAVE_INTERVAL_MS = parseInt(process.env.SAVE_INTERVAL_MS || '5000', 10);
const STATE_FILE = process.env.STATE_FILE || 'blockchain_state.json';
const UI_UPDATE_INTERVAL_MS = parseInt(process.env.UI_UPDATE_INTERVAL_MS || '1000', 10);
const TARGET_BLOCK_TIME_MS = parseInt(process.env.TARGET_BLOCK_TIME_MS || '2000', 10);
const DIFFICULTY_ADJUST_INTERVAL = parseInt(process.env.DIFFICULTY_ADJUST_INTERVAL || '10', 10);

// Initialize blockchain
let blockchain: Blockchain;
try {
  const rawData = fs.readFileSync(path.join(__dirname, STATE_FILE), 'utf8');
  const data = JSON.parse(rawData);
  blockchain = new Blockchain(
    data.difficulty || DIFFICULTY,
    data.miningReward || MINING_REWARD,
    data.targetBlockTime || TARGET_BLOCK_TIME_MS,
    DIFFICULTY_ADJUST_INTERVAL
  );
  blockchain.chain = data.chain.map((blockData: any) => {
    const txs = blockData.transactions.map((txData: any) => Transaction.fromData(txData));
    return new Block(
      blockData.index,
      blockData.timestamp,
      txs,
      blockData.previousHash,
      blockData.nonce,
      blockData.hash
    );
  });
  blockchain.pendingTransactions = data.pendingTransactions.map((txData: any) => Transaction.fromData(txData));
  blockchain.walletBalances = new Map(data.walletBalances.map((wb: any) => [wb.address, wb.balance]));
  console.log(`Loaded blockchain from ${STATE_FILE}`);
} catch (err) {
  blockchain = new Blockchain(DIFFICULTY, MINING_REWARD, TARGET_BLOCK_TIME_MS, DIFFICULTY_ADJUST_INTERVAL);
  console.log('Created new blockchain');
}

// Create wallets
const wallets: Wallet[] = [];
for (let i = 0; i < 5; i++) {
  wallets.push(new Wallet());
  blockchain.walletBalances.set(wallets[i].address, 1000);
}

// Terminal UI
const terminalUI = new TerminalUI();
terminalUI.updateState(blockchain.getState());
terminalUI.start(UI_UPDATE_INTERVAL_MS);

function broadcastState() {
  const state = blockchain.getState();
  terminalUI.updateState(state);
  const data = JSON.stringify(state);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function saveState() {
  const state = blockchain.getState();
  fs.writeFileSync(path.join(__dirname, STATE_FILE), JSON.stringify(state, null, 2));
}

setInterval(saveState, SAVE_INTERVAL_MS);

async function runSimulation() {
  while (true) {
    const numTx = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numTx; i++) {
      const sender = wallets[Math.floor(Math.random() * wallets.length)];
      let recipient = wallets[Math.floor(Math.random() * wallets.length)];
      while (recipient === sender) {
        recipient = wallets[Math.floor(Math.random() * wallets.length)];
      }
      // Random amount between 0.1 and 50 coins (with decimals)
      const amount = Math.round((Math.random() * 49.9 + 0.1) * 100) / 100;
      // Random fee between 0.01 and 0.5 coins
      const fee = Math.round((Math.random() * 0.49 + 0.01) * 100) / 100;
      const tx = new Transaction(sender.address, recipient.address, amount, fee);
      tx.signature = sender.sign(tx.calculateHash());
      blockchain.addTransaction(tx);
    }

    const miner = wallets[Math.floor(Math.random() * wallets.length)];
    blockchain.minePendingTransactions(miner.address);

    broadcastState();

    await new Promise(resolve => setTimeout(resolve, BLOCK_INTERVAL_MS));
  }
}

runSimulation().catch(console.error);

// WebSocket heartbeat
const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if ((ws as any).isAlive === false) return ws.terminate();
    (ws as any).isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws) => {
  (ws as any).isAlive = true;
  ws.on('pong', () => {
    (ws as any).isAlive = true;
  });
  ws.send(JSON.stringify(blockchain.getState()));
});

wss.on('close', () => {
  clearInterval(heartbeat);
});

app.get('/api/state', (req, res) => res.json(blockchain.getState()));
app.get('/api/blocks', (req, res) => res.json(blockchain.chain.map(block => block.toData())));
app.get('/api/blocks/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (index >= 0 && index < blockchain.chain.length) {
    res.json(blockchain.chain[index].toData());
  } else {
    res.status(404).json({ error: 'Block not found' });
  }
});
app.get('/api/transactions/pending', (req, res) => res.json(blockchain.pendingTransactions.map(tx => tx.toData())));
app.get('/api/wallets', (req, res) => {
  const walletBalances = blockchain.walletBalances;
  const result = wallets.map(wallet => ({
    address: wallet.address,
    balance: walletBalances.get(wallet.address) || 0,
  }));
  res.json(result);
});

process.on('SIGINT', () => {
  terminalUI.stop();
  console.log('\nSaving state before exit...');
  saveState();
  process.exit(0);
});
process.on('SIGTERM', () => {
  terminalUI.stop();
  saveState();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`Difficulty: ${DIFFICULTY}, Mining reward: ${MINING_REWARD}`);
  console.log(`Block interval: ${BLOCK_INTERVAL_MS}ms, UI update: ${UI_UPDATE_INTERVAL_MS}ms`);
});