import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletStore } from '../store/walletStore';
import { Wallet } from 'lucide-react';
import Card from './Card';

const WalletButton: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connectWallet, disconnectWallet } = useWalletStore();

  React.useEffect(() => {
    const handleWalletChange = async () => {
      if (connected && publicKey) {
        try {
          await connectWallet(publicKey.toString());
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }
      } else {
        try {
          await disconnectWallet();
        } catch (error) {
          console.error('Error disconnecting wallet:', error);
        }
      }
    };

    handleWalletChange();
  }, [connected, publicKey, connectWallet, disconnectWallet]);

  return (
    <Card className="bg-black border border-[#e1ffa6] p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[#e1ffa6]">
          <Wallet className="w-5 h-5" />
          <span className="font-medium">Connect Wallet</span>
        </div>
        <WalletMultiButton 
          className="!flex !items-center !justify-center !gap-2 !bg-gradient-to-r !from-[#e1ffa6] !to-[#9dff00] !text-black 
                     !border-none !rounded-full !h-auto !py-3 !px-8 !font-medium !text-sm !w-full
                     hover:!opacity-90 !transition-all !duration-200 !shadow-lg !shadow-[#e1ffa6]/20"
          startIcon={<Wallet className="!w-5 !h-5" />}
        />
        <p className="text-sm text-gray-400 text-center">
          Connect your Solana wallet to enable crypto features
        </p>
      </div>
    </Card>
  );
};

export default WalletButton;

export { WalletButton }