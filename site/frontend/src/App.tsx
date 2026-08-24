import { useState, useEffect } from 'react';
import { BlockchainState } from './types';
import Stats from './components/Stats';
import TransactionList from './components/TransactionList';
import BlockList from './components/BlockList';

function App() {
  const [state, setState] = useState<BlockchainState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => setConnectionStatus('connected');
    socket.onclose = () => setConnectionStatus('disconnected');
    socket.onerror = () => setConnectionStatus('disconnected');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as BlockchainState;
      setState(data);
    };

    return () => socket.close();
  }, []);

  if (!state) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p>Connecting to blockchain...</p>
      </div>
    );
  }

  const allTransactions = [
    ...state.chain.flatMap(block => block.transactions),
    ...state.pendingTransactions,
  ];

  const confirmedTransactions = state.chain.flatMap(block => block.transactions);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Blockchain Dashboard</h1>
          <span className={`status-badge ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '● Live' : connectionStatus === 'connecting' ? '● Connecting' : '● Disconnected'}
          </span>
        </div>
        <div className="header-right">
          <span>Difficulty: {state.difficulty}</span>
          <span>Reward: {state.miningReward} coins</span>
        </div>
      </header>

      <Stats state={state} />

      <div className="grid-container">
        <div className="grid-item">
          <TransactionList
            title="All Transactions"
            transactions={allTransactions}
            maxItems={10}
          />
        </div>
        <div className="grid-item">
          <TransactionList
            title="Confirmed Transactions"
            transactions={confirmedTransactions}
            maxItems={10}
            confirmed
          />
        </div>
        <div className="grid-item">
          <TransactionList
            title="Pending Transactions"
            transactions={state.pendingTransactions}
            maxItems={10}
          />
        </div>
      </div>

      <BlockList blocks={state.chain} />
    </div>
  );
}

export default App;