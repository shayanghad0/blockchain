import { useState, useEffect } from 'react';
import { BlockchainState } from './types';
import Stats from './components/Stats';
import TransactionList from './components/TransactionList';
import BlockList from './components/BlockList';

function App() {
  const [state, setState] = useState<BlockchainState | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
    setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as BlockchainState;
      setState(data);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="app">
      <h1>Blockchain Dashboard</h1>
      {!state ? (
        <p>Connecting...</p>
      ) : (
        <>
          <Stats state={state} />
          <div className="columns">
            <TransactionList
              title="All Transactions"
              transactions={[
                ...state.chain.flatMap(block => block.transactions),
                ...state.pendingTransactions,
              ]}
            />
            <TransactionList
              title="Successful (Confirmed) Transactions"
              transactions={state.chain.flatMap(block => block.transactions)}
              successful
            />
            <TransactionList
              title="Pending Transactions"
              transactions={state.pendingTransactions}
            />
          </div>
          <BlockList blocks={state.chain} />
        </>
      )}
    </div>
  );
}

export default App;