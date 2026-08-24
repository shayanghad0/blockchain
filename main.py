import hashlib
import json
import time
import secrets
import random
import shutil

# ---------- Wallet ----------
class Wallet:
    """Simulates a user wallet with a private key and public address."""
    def __init__(self):
        self.private_key = secrets.token_hex(32)
        self.address = hashlib.sha256(self.private_key.encode()).hexdigest()[:40]

    def sign(self, data):
        return hashlib.sha256((data + self.private_key).encode()).hexdigest()

    def __repr__(self):
        return f"Wallet(address={self.address[:8]}...)"

# ---------- Transaction ----------
class Transaction:
    """Represents a transfer of coins between two addresses."""
    def __init__(self, sender, recipient, amount, timestamp=None, signature=None):
        self.sender = sender
        self.recipient = recipient
        self.amount = amount
        self.timestamp = timestamp or time.time()
        self.signature = signature

    def calculate_hash(self):
        data = f"{self.sender}{self.recipient}{self.amount}{self.timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()

    def to_dict(self):
        return {
            "sender": self.sender,
            "recipient": self.recipient,
            "amount": self.amount,
            "timestamp": self.timestamp,
            "signature": self.signature
        }

    @staticmethod
    def from_dict(data):
        return Transaction(
            sender=data["sender"],
            recipient=data["recipient"],
            amount=data["amount"],
            timestamp=data["timestamp"],
            signature=data["signature"]
        )

# ---------- Block ----------
class Block:
    """A block contains a list of transactions and a link to the previous block."""
    def __init__(self, index, timestamp, transactions, previous_hash, nonce=0, hash=None):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = hash or self.calculate_hash()

    def calculate_hash(self):
        tx_string = "".join(tx.calculate_hash() for tx in self.transactions)
        data = f"{self.index}{self.timestamp}{tx_string}{self.previous_hash}{self.nonce}"
        return hashlib.sha256(data.encode()).hexdigest()

    def mine_block(self, difficulty):
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        print(f"Block #{self.index} mined: {self.hash}")

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": [tx.to_dict() for tx in self.transactions],
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash
        }

    @staticmethod
    def from_dict(data):
        transactions = [Transaction.from_dict(tx) for tx in data["transactions"]]
        return Block(
            index=data["index"],
            timestamp=data["timestamp"],
            transactions=transactions,
            previous_hash=data["previous_hash"],
            nonce=data["nonce"],
            hash=data["hash"]
        )

# ---------- Blockchain ----------
class Blockchain:
    """The blockchain itself: a chain of blocks with transaction handling."""
    def __init__(self, difficulty=2, mining_reward=50):
        self.chain = [self.create_genesis_block()]
        self.difficulty = difficulty
        self.mining_reward = mining_reward
        self.pending_transactions = []

    def create_genesis_block(self):
        return Block(0, time.time(), [], "0" * 64)

    def get_latest_block(self):
        return self.chain[-1]

    def add_transaction(self, transaction):
        self.pending_transactions.append(transaction)

    def mine_pending_transactions(self, miner_address):
        reward_tx = Transaction(
            sender="NETWORK",
            recipient=miner_address,
            amount=self.mining_reward,
            signature="COINBASE"
        )
        block_transactions = [reward_tx] + self.pending_transactions

        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            transactions=block_transactions,
            previous_hash=self.get_latest_block().hash
        )

        new_block.mine_block(self.difficulty)

        self.chain.append(new_block)
        self.pending_transactions = []
        print(f"Block added with {len(block_transactions)} transaction(s). Reward paid to {miner_address[:8]}...")

    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]

            if current.hash != current.calculate_hash():
                print(f"Invalid hash at block {i}")
                return False
            if current.previous_hash != previous.hash:
                print(f"Broken chain at block {i}")
                return False
            if current.hash[:self.difficulty] != "0" * self.difficulty:
                print(f"Block {i} does not satisfy proof-of-work")
                return False
        return True

    def save_to_file(self, filename):
        data = {
            "difficulty": self.difficulty,
            "mining_reward": self.mining_reward,
            "chain": [block.to_dict() for block in self.chain],
            "pending_transactions": [tx.to_dict() for tx in self.pending_transactions]
        }
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Blockchain saved to {filename}")

    @classmethod
    def load_from_file(cls, filename):
        with open(filename, "r") as f:
            data = json.load(f)
        blockchain = cls(difficulty=data["difficulty"], mining_reward=data["mining_reward"])
        blockchain.chain = [Block.from_dict(block_data) for block_data in data["chain"]]
        blockchain.pending_transactions = [Transaction.from_dict(tx) for tx in data["pending_transactions"]]
        return blockchain

# ---------- Main: Auto Transaction Generation with Auto-Save ----------
if __name__ == "__main__":
    # Configuration
    AUTOSAVE_AFTER_BLOCK = True   # Save after each mined block
    AUTOSAVE_AFTER_TX = True      # Save after generating transactions (before mining)
    BLOCK_DELAY = 2               # seconds between blocks
    FILENAME = "blockchain.json"

    # Load existing blockchain or create new
    try:
        blockchain = Blockchain.load_from_file(FILENAME)
        print(f"Loaded existing blockchain from {FILENAME}")
    except FileNotFoundError:
        blockchain = Blockchain(difficulty=2, mining_reward=50)
        print("No existing blockchain found. Created new blockchain.")
    except json.JSONDecodeError as e:
        print(f"Error loading {FILENAME}: {e}")
        print("The file is corrupt or empty. Creating a new blockchain and backing up the corrupt file.")
        try:
            shutil.copy(FILENAME, "blockchain_corrupt_backup.json")
            print("Corrupt file backed up to blockchain_corrupt_backup.json")
        except Exception as backup_error:
            print(f"Could not back up corrupt file: {backup_error}")
        blockchain = Blockchain(difficulty=2, mining_reward=50)

    # Create a pool of wallets
    wallets = [Wallet() for _ in range(5)]
    print(f"Created {len(wallets)} wallets:")
    for i, w in enumerate(wallets):
        print(f"  Wallet {i}: {w.address[:10]}...")

    print(f"\nStarting automatic transaction generation.")
    print(f"Auto-saving after transactions and after each block. Press Ctrl+C to stop and save.\n")

    try:
        while True:
            # Generate 1-3 random transactions
            num_tx = random.randint(1, 3)
            for _ in range(num_tx):
                sender = random.choice(wallets)
                recipient = random.choice(wallets)
                while recipient == sender:
                    recipient = random.choice(wallets)
                amount = random.randint(1, 100)
                tx = Transaction(sender.address, recipient.address, amount)
                tx.signature = sender.sign(tx.calculate_hash())
                blockchain.add_transaction(tx)
                print(f"  New transaction: {sender.address[:8]}... -> {recipient.address[:8]}... : {amount} coins")

            # Save after generating transactions (so pending_transactions are stored)
            if AUTOSAVE_AFTER_TX and blockchain.pending_transactions:
                print("\nSaving pending transactions to file...")
                blockchain.save_to_file(FILENAME)

            # Mine pending transactions (reward goes to a random wallet)
            miner = random.choice(wallets)
            blockchain.mine_pending_transactions(miner.address)

            # Save after mining (new block added, pending list empty)
            if AUTOSAVE_AFTER_BLOCK:
                print("\nSaving after block...")
                blockchain.save_to_file(FILENAME)
                print(f"Chain validity: {blockchain.is_chain_valid()}\n")

            time.sleep(BLOCK_DELAY)

    except KeyboardInterrupt:
        print("\n\nStopping... Saving final state to file.")
        blockchain.save_to_file(FILENAME)
        print(f"Final chain length: {len(blockchain.chain)} blocks")
        print("Goodbye!")