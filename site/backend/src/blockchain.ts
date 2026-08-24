import * as crypto from 'crypto';
import { TransactionData, BlockData, BlockchainState } from './types';

// ---------- Helper ----------
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ---------- Wallet ----------
export class Wallet {
  public address: string;
  private privateKey: string;

  constructor() {
    this.privateKey = crypto.randomBytes(32).toString('hex');
    this.address = sha256(this.privateKey).slice(0, 40);
  }

  sign(data: string): string {
    return sha256(data + this.privateKey);
  }
}

// ---------- Transaction ----------
export class Transaction {
  public sender: string;
  public recipient: string;
  public amount: number;
  public timestamp: number;
  public signature: string;

  constructor(sender: string, recipient: string, amount: number, timestamp?: number, signature?: string) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.timestamp = timestamp || Date.now();
    this.signature = signature || '';
  }

  calculateHash(): string {
    return sha256(`${this.sender}${this.recipient}${this.amount}${this.timestamp}`);
  }

  toData(): TransactionData {
    return {
      sender: this.sender,
      recipient: this.recipient,
      amount: this.amount,
      timestamp: this.timestamp,
      signature: this.signature,
    };
  }

  static fromData(data: TransactionData): Transaction {
    return new Transaction(data.sender, data.recipient, data.amount, data.timestamp, data.signature);
  }
}

// ---------- Block ----------
export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public nonce: number;
  public hash: string;

  constructor(index: number, timestamp: number, transactions: Transaction[], previousHash: string, nonce = 0, hash?: string) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = hash || this.calculateHash();
  }

  calculateHash(): string {
    const txString = this.transactions.map(tx => tx.calculateHash()).join('');
    return sha256(`${this.index}${this.timestamp}${txString}${this.previousHash}${this.nonce}`);
  }

  mineBlock(difficulty: number): void {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block #${this.index} mined: ${this.hash}`);
  }

  toData(): BlockData {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map(tx => tx.toData()),
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
    };
  }

  static fromData(data: BlockData): Block {
    const transactions = data.transactions.map(tx => Transaction.fromData(tx));
    return new Block(data.index, data.timestamp, transactions, data.previousHash, data.nonce, data.hash);
  }
}

// ---------- Blockchain ----------
export class Blockchain {
  public chain: Block[];
  public pendingTransactions: Transaction[];
  public difficulty: number;
  public miningReward: number;

  constructor(difficulty = 1, miningReward = 50) {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = difficulty;
    this.miningReward = miningReward;
  }

  private createGenesisBlock(): Block {
    return new Block(0, Date.now(), [], '0'.repeat(64));
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction);
  }

  minePendingTransactions(minerAddress: string): void {
    const rewardTx = new Transaction('NETWORK', minerAddress, this.miningReward, Date.now(), 'COINBASE');
    const blockTransactions = [rewardTx, ...this.pendingTransactions];

    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      blockTransactions,
      this.getLatestBlock().hash
    );

    newBlock.mineBlock(this.difficulty);

    this.chain.push(newBlock);
    this.pendingTransactions = [];
    console.log(`Block added with ${blockTransactions.length} transaction(s). Reward paid to ${minerAddress.slice(0, 8)}...`);
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) {
        console.error(`Invalid hash at block ${i}`);
        return false;
      }
      if (current.previousHash !== previous.hash) {
        console.error(`Broken chain at block ${i}`);
        return false;
      }
      if (current.hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
        console.error(`Block ${i} does not satisfy proof-of-work`);
        return false;
      }
    }
    return true;
  }

  getState(): BlockchainState {
    return {
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      chain: this.chain.map(block => block.toData()),
      pendingTransactions: this.pendingTransactions.map(tx => tx.toData()),
    };
  }
}