import { BlockchainState } from '../types';

interface Props {
  state: BlockchainState;
}

const Stats = ({ state }: Props) => {
  const totalTransactions = state.chain.reduce(
    (acc, block) => acc + block.transactions.length,
    0
  );

  return (
    <div className="stats">
      <div className="stat-card">
        <h3>Blocks</h3>
        <div className="value">{state.chain.length}</div>
      </div>
      <div className="stat-card">
        <h3>Confirmed Transactions</h3>
        <div className="value">{totalTransactions}</div>
      </div>
      <div className="stat-card">
        <h3>Pending Transactions</h3>
        <div className="value">{state.pendingTransactions.length}</div>
      </div>
      <div className="stat-card">
        <h3>Mining Difficulty</h3>
        <div className="value">{state.difficulty}</div>
      </div>
      <div className="stat-card">
        <h3>Mining Reward</h3>
        <div className="value">{state.miningReward}</div>
      </div>
    </div>
  );
};

export default Stats;