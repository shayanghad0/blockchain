export interface TransactionData {
  sender: string;
  recipient: string;
  amount: number;
  timestamp: number;
  signature: string;
}

export interface BlockData {
  index: number;
  timestamp: number;
  transactions: TransactionData[];
  previousHash: string;
  nonce: number;
  hash: string;
}

export interface BlockchainState {
  difficulty: number;
  miningReward: number;
  chain: BlockData[];
  pendingTransactions: TransactionData[];
}