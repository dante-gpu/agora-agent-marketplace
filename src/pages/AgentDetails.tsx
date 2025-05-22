import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Share2, ArrowLeft, Zap, Clock, Code, Brain } from 'lucide-react';
import { useAgentStore } from '../store/agentStore';
import { useAuthStore } from '../store/authStore';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ChatWindow from '../components/ChatWindow';
import { supabase } from '../lib/supabase';
import dayjs from "dayjs";
import { useWallet } from "@solana/wallet-adapter-react";


interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  username: string;
}

interface Capability {
  icon: React.ElementType;
  name: string;
  description: string;
}

function AgentDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getAgentBySlug, loading, error } = useAgentStore();
  const [agent, setAgent] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [rentalInfo, setRentalInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const { publicKey } = useWallet();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);



useEffect(() => {
  const fetchData = async () => {
    if (!slug) return;

    const agentData = await getAgentBySlug(slug);
    if (agentData) {
      setAgent(agentData);
      fetchReviews(agentData.id);
    }

    await fetchRentalInfo();
  };

  fetchData();
}, [slug, publicKey]);

useEffect(() => {
  if (remainingSeconds === null) return;

  const interval = setInterval(() => {
    setRemainingSeconds((prev) => {
      if (prev === null || prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [remainingSeconds]);

useEffect(() => {
  if (remainingSeconds !== null) {
    const hrs = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;

    setTimeLeft(
      `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    );

    setExpired(remainingSeconds <= 0);
  }
}, [remainingSeconds]);

const fetchRentalInfo = async () => {
  console.log("📥 [fetchRentalInfo] called");

  if (!publicKey || !slug) {
    console.warn("🚫 Missing publicKey or slug:", { publicKey, slug });
    return;
  }

  const { data, error } = await supabase
    .from("rentals")
    .select("end_time")
    .eq("user_wallet", publicKey.toBase58())
    .eq("agent_slug", slug)
    .order("end_time", { ascending: false })
    .limit(1);

  console.log("🔍 Supabase rental query result:", data);

  if (error || !data || data.length === 0) {
    console.warn("⚠️ No rental data or error:", error);
    setRemainingSeconds(null);
    return;
  }

  const endTime = new Date(data[0].end_time).getTime();
  const now = Date.now();

  if (endTime > now) {
    const seconds = Math.floor((endTime - now) / 1000);
    console.log("✅ [fetchRentalInfo] Rental is active. Seconds left:", seconds);
    setRemainingSeconds(seconds);
  } else {
    console.log("⛔ [fetchRentalInfo] Rental expired");
    setRemainingSeconds(0);
  }
};

  const startCountdown = (expiresAt: string) => {
    const interval = setInterval(() => {
      const diff = dayjs(expiresAt).diff(dayjs(), "second");
  
      if (diff <= 0) {
        setTimeLeft(null);
        setExpired(true);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);
  };

  const fetchReviews = async (agentId: string) => {
    try {
      // First get the reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('agent_reviews')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      const userIds = reviewsData.map(review => review.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        return;
      }
      
      const userMap = profilesData.reduce((acc: Record<string, string>, profile) => {
        acc[profile.user_id] = profile.username;
        return acc;
      }, {});

      const reviewsWithUsernames = reviewsData.map(review => ({
        ...review,
        username: userMap[review.user_id] || 'Unknown User'
      }));

      setReviews(reviewsWithUsernames);
    } catch (error) {
      console.error('Error in fetchReviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !agent) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('agent_reviews')
        .insert({
          agent_id: agent.id,
          user_id: user.id,
          rating: userReview.rating,
          comment: userReview.comment
        });

      if (error) throw error;
      fetchReviews(agent.id);
      setUserReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const capabilities: Record<string, Capability> = {
    chat: { icon: MessageSquare, name: 'Chat', description: 'Natural conversation abilities' },
    coding: { icon: Code, name: 'Coding', description: 'Programming assistance' },
    reasoning: { icon: Brain, name: 'Reasoning', description: 'Complex problem solving' },
    quick_responses: { icon: Zap, name: 'Fast', description: 'Quick response time' },
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error || 'Agent not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Agent Info */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <button className="p-2 hover:bg-gray-800 rounded-lg">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            
            {agent.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden mb-6">
                <img
                  src={agent.image_url}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#e1ffa6]" fill="#e1ffa6" />
                <span>{agent.rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">{agent.deployments} uses</span>
              <Badge>{agent.category}</Badge>
            </div>

            <p className="text-gray-300 mb-8">{agent.description}</p>

            {/* Capabilities */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Object.entries(agent.technical_specs?.capabilities || {}).map(([key]) => {
                const capability = capabilities[key];
                if (!capability) return null;
                const Icon = capability.icon;
                return (
                  <div key={key} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                    <Icon className="w-5 h-5 text-[#e1ffa6]" />
                    <div>
                      <h3 className="font-medium">{capability.name}</h3>
                      <p className="text-sm text-gray-400">{capability.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Technical Specs */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Technical Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">Context Length</h3>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#e1ffa6]" />
                    <span>{agent.technical_specs?.context_length?.toLocaleString()} tokens</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">Response Speed</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#e1ffa6]" />
                    <span className="capitalize">{agent.technical_specs?.response_speed?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reviews Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Reviews</h2>
            
            {user && (
              <Card className="mb-6">
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setUserReview(prev => ({ ...prev, rating }))}
                          className={`p-2 rounded-lg transition-colors ${
                            userReview.rating >= rating
                              ? 'text-[#e1ffa6]'
                              : 'text-gray-600'
                          }`}
                        >
                          <Star fill={userReview.rating >= rating ? '#e1ffa6' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Comment</label>
                    <textarea
                      value={userReview.comment}
                      onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" loading={submitting}>
                    Submit Review
                  </Button>
                </form>
              </Card>
            )}

            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">{review.username}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#e1ffa6]" fill="#e1ffa6" />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-300">{review.comment}</p>
                  <span className="block text-sm text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="sticky top-24">
  {expired ? (
    <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 text-center">
      ⏰ Süreniz doldu. Bu agent'ı tekrar kiralamanız gerekiyor.
    </div>
  ) : !timeLeft ? (
    <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 rounded-lg p-4 text-center">
      Bu agent için geçerli bir kiralama bulunamadı.
    </div>
  ) : (
    <>
      <div className="text-sm text-gray-400 mb-2 text-center">
        ⏳ Kalan Süre: <span className="text-white font-medium">{timeLeft}</span>
      </div>
      <ChatWindow agentId={agent.id} agentName={agent.name} />
    </>
  )}
</div>

      </div>
    </div>
  );
}

export default AgentDetails;