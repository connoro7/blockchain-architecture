import * as crypto from 'crypto'

// Handles funds transfer for payer->payee wallet
class Transaction {
  constructor(
    public amount: number,
    public payer: string, // public key
    public payee: string // public key
  ) {}

  toString() {
    return JSON.stringify(this)
  }
}

// Single block on the chain
class Block {
    public nonce = Math.round(Math.random() * 9999999999)
    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public timestamp = Date.now(),
    ) {}
    
    // writes data as SHA256 hash
    get hash() {
        const str = JSON.stringify(this)
        const hash = crypto.createHash('SHA256')
        hash.update(str).end()
        return hash.digest('hex')    
    }

}

class Chain {
    public static instance = new Chain() // Singleton

    chain: Block[]

    constructor() {
        // Creates genesis block
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))]
    }

    // Gets most recent block
    get lastBlock() {
        return this.chain[this.chain.length -1]
   }

   // Add new block to chain if signature and proof-of-work are valid
   addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    //    const newBlock = new Block(this.lastBlock.hash, transaction)
    //    this.chain.push(newBlock)

    const verifier = crypto.createVerify('SHA256')
    verifier.update(transaction.toString())

    const isValid  = verifier.verify(senderPublicKey, signature)

    if (isValid) {
        const newBlock = new Block(this.lastBlock.hash, transaction)
        this.mine(newBlock.nonce)
        this.chain.push(newBlock)
    }
   }

   // validation for proof-of-work
   mine(nonce: number) {
       let solution = 1
       console.log('mining...')
       while(true) {
           const hash = crypto.createHash('MD5')
           hash.update((nonce + solution).toString()).end()

           const attempt = hash.digest('hex')

           if (attempt.substr(0,4) === '0000') {
               console.log(`Solved: ${solution}`)
               return solution
           }
           
           // mining algo goes here :)
           solution += 1
       }
   }
}

// Creates public and private key pair for user
class Wallet {
    public publicKey: string
    public privateKey: string

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
        })

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
    }

    // handles signing for sending
    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey)

        const sign = crypto.createSign('SHA256')
        sign.update(transaction.toString()).end()

        const signature = sign.sign(this.privateKey)
        Chain.instance.addBlock(transaction, this.publicKey, signature)
    }
}

// Built-in example usage - use `npm run start` for live implementation
const satoshi = new Wallet()
const connor = new Wallet()
const james = new Wallet()

satoshi.sendMoney(50, connor.publicKey)
connor.sendMoney(20, james.publicKey)
james.sendMoney(5, satoshi.publicKey)

console.log(Chain.instance)