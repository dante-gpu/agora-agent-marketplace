import React, { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import Card from "./Card";
import Badge from "./Badge";
import { useWallet } from "@solana/wallet-adapter-react";
import { calculateDGPUAmount } from "../utils/calculateRentalPrice";
import { sendDGPUToken } from "../solana/payment";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface AgentCardProps {
  name: string;
  description: string;
  uses: string;
  rating: number;
  category: string;
  price?: number;
  imageUrl?: string;
  slug: string;
}

const AgentCard = ({
  name,
  description,
  uses,
  rating,
  category,
  imageUrl,
  slug,
}: AgentCardProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const navigate = useNavigate();

  const [hours, setHours] = useState<number>(1);
  const [dgpuPricePerHour, setDgpuPricePerHour] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      const hourlyDgpu = await calculateDGPUAmount(slug, 1);
      console.log("💸 Hourly dGPU fetched:", hourlyDgpu);
      setDgpuPricePerHour(Number(hourlyDgpu.toFixed(6)));
    };
    fetchPrice();
  }, [slug]);

  const totalPrice = Number((dgpuPricePerHour * hours).toFixed(6));

  const handleRent = async () => {
    try {
      setLoading(true);
      console.log("🔵 Rent Now button clicked");
      console.log("⏳ Step 1: Rent start, slug:", slug);
  
      if (!slug || !publicKey || !sendTransaction) {
        console.error("❌ Missing wallet or slug");
        setLoading(false);
        return;
      }
  
      const walletAddress = publicKey.toBase58();
      console.log("💳 Wallet address:", walletAddress);
  
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("🪪 Supabase session:", sessionData);
      console.log("🪪 Session error:", sessionError);
  
      console.log("⏳ Step 2: Calculating dGPU...");
      const totalDGPU = await calculateDGPUAmount(slug, hours);
      console.log("💰 Step 3: Calculated total dGPU:", totalDGPU);
  
      const txSig = await sendDGPUToken({
        senderPublicKey: publicKey,
        sendTransaction,
        amount: totalDGPU,
      });
      console.log("📩 Step 4: Got transaction signature:", txSig);
  
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
      console.log("🕒 Step 5: start:", startTime.toISOString());
      console.log("🕒 Step 5: end:", endTime.toISOString());
  
      const insertPayload = {
        user_wallet: walletAddress,
        agent_slug: slug,
        duration_hours: hours,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tx_signature: txSig,
      };
  
      console.log("🧾 Insert Payload:", insertPayload);
      console.log("🧪 Attempting insert to Supabase via fetch...");
  
      const res = await fetch("https://lxpnwnjvnwcfmdvivvxo.supabase.co/rest/v1/rentals", {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(insertPayload),
      });
  
      const result = await res.json();
  
      if (!res.ok) {
        console.error("❌ Fetch insert error:", result);
        alert("❌ Insert failed: " + result?.message || "Unknown error");
        setLoading(false);
        return;
      }
  
      console.log("✅ Insert success:", result);
      setSuccess(txSig);
  
      navigate(`/agent/${slug}`, {
        state: { activeUntil: endTime.toISOString() },
      });
  
      console.log("🚀 Step 6: Navigation complete");
    } catch (err) {
      console.error("💥 Fatal error in handleRent:", err);
      alert("💥 Unexpected error: " + err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="group h-full relative overflow-hidden cursor-default">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#e1ffa6]/5 rounded-full blur-2xl transition-colors" />

      {imageUrl && (
        <div className="aspect-square rounded-lg overflow-hidden mb-4 pointer-events-none">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold transition-colors duration-300 cursor-default">
              {name}
            </h3>
            <Badge size="sm" glass>{category}</Badge>
          </div>
          <div className="flex items-center gap-2 text-gray-400 transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Chat</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2 transition-colors">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#e1ffa6]/10 text-[#e1ffa6] px-2.5 py-1 rounded-full">
              <Star className="w-4 h-4" fill="#e1ffa6" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400">{uses} uses</span>
          </div>

          <div className="bg-gray-800/50 px-3 py-1 rounded-full text-[#e1ffa6] transition-colors">
            {dgpuPricePerHour ? `${dgpuPricePerHour} dGPU / hr` : 'Loading...'}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <input
            type="number"
            min={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            className="w-full px-3 py-1 bg-gray-800 text-white rounded outline-none"
          />
          <button
            disabled={loading || totalPrice === 0}
            onClick={(e) => {
              e.stopPropagation();
              handleRent();
            }}
            className="bg-[#e1ffa6] text-black font-semibold py-2 rounded hover:bg-lime-300 transition-colors"
          >
            {loading ? "Processing..." : `Rent Now (${totalPrice} dGPU)`}
          </button>

          {success && (
            <a
              href={`https://explorer.solana.com/tx/${success}?cluster=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-lime-400 mt-1 underline"
              onClick={(e) => e.stopPropagation()}
            >
              View transaction on Solana Explorer
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AgentCard;