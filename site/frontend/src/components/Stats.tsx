import { BlockchainState } from '../types';

interface Props {
  state: BlockchainState;
}

const Stats = ({ state }: Props) => {
  const confirmedTxCount = state.chain.reduce(
    (acc, block) => acc + block.transactions.length,
    0
  );

  const totalCoins = state.walletBalances.reduce(
    (acc, wallet) => acc + wallet.balance,
    0
  );

  return (
    <div className="stats">
      <div className="stat-card">
        <h3>Blocks</h3>
        <div className="value">{state.chain.length}</div>
      </div>
      <div className="stat-card">
        <h3>Confirmed Tx</h3>
        <div className="value">{confirmedTxCount}</div>
      </div>
      <div className="stat-card">
        <h3>Pending Tx</h3>
        <div className="value">{state.pendingTransactions.length}</div>
      </div>
      <div className="stat-card">
        <h3>Difficulty</h3>
        <div className="value">{state.difficulty}</div>
      </div>
      <div className="stat-card">
        <h3>Mining Reward</h3>
        <div className="value">{state.miningReward}</div>
      </div>
      <div className="stat-card">
        <h3>Total Coins</h3>
        <div className="value">{totalCoins}</div>
      </div>
    </div>
  );
};

export default Stats;