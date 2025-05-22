import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  import {
    Connection,
    PublicKey,
    Transaction,
    Keypair,
  } from "@solana/web3.js";
  
  const dGPUMint = new PublicKey(import.meta.env.VITE_DGPU_MINT);
  
  const treasuryWallet = new PublicKey("5VDb4wQtVicSPhHWX9Pd9ZpvVpweZPAk4q5oL2fECWB9");
  
  const connection = new Connection(import.meta.env.VITE_HELIUS_RPC_URL, "confirmed");
  
  export async function sendDGPUToken({
    senderPublicKey,
    sendTransaction,
    amount,
  }: {
    senderPublicKey: PublicKey;
    sendTransaction: (tx: Transaction, conn: Connection) => Promise<string>;
    amount: number;
  }): Promise<string> {
    const senderTokenAccount = await getAssociatedTokenAddress(dGPUMint, senderPublicKey);
    const receiverTokenAccount = await getAssociatedTokenAddress(dGPUMint, treasuryWallet);
  
    const amountInSmallestUnit = BigInt(Math.floor(amount * 1e6)); 
  
    const ix = createTransferInstruction(
      senderTokenAccount,
      receiverTokenAccount,
      senderPublicKey,
      amountInSmallestUnit,
      [],
      TOKEN_PROGRAM_ID
    );
  
    const tx = new Transaction().add(ix);
    tx.feePayer = senderPublicKey;
  
    const txSig = await sendTransaction(tx, connection);
    return txSig;
  }
  
  if (typeof window === "undefined") {
    import("fs").then((fs) => {
      const secret = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
      const user = Keypair.fromSecretKey(Uint8Array.from(secret));
  
      async function testTransfer() {
        const sig = await sendDGPUToken({
          senderPublicKey: user.publicKey,
          sendTransaction: async (tx: Transaction, connection: Connection) => {
            const latestBlockhash = await connection.getLatestBlockhash();
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.feePayer = user.publicKey;
            tx.sign(user);
  
            const rawTx = tx.serialize();
            return await connection.sendRawTransaction(rawTx);
          },
          amount: 0.5,
        });
  
        console.log("✅ Transaction Signature:", sig);
      }
  
      testTransfer().catch(console.error);
    });
  }
  