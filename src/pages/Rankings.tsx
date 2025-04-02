import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, MessageSquare, Crown, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

interface Agent {
  id: string;
  name: string;
  description: string;
  rating: number;
  deployments: number;
  category: string;
  image_url: string;
  slug: string;
  created_at: string;
  weekly_growth: number;
  rank_change: number;
}

type SortField = 'rating' | 'deployments' | 'weekly_growth';

function Rankings() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('rating');
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    async function fetchRankings() {
      try {
        setLoading(true);
        let query = supabase
          .from('agents')
          .select('*')
          .eq('status', 'active')
          .eq('is_official', true);

        // Apply sorting based on selected field
        switch (sortField) {
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'deployments':
            query = query.order('deployments', { ascending: false });
            break;
          case 'weekly_growth':
            query = query.order('weekly_growth', { ascending: false });
            break;
        }

        // Apply time range filter if needed
        if (timeRange === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query = query.gte('created_at', weekAgo.toISOString());
        } else if (timeRange === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          query = query.gte('created_at', monthAgo.toISOString());
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setAgents(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, [sortField, timeRange]);

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Official Agent Rankings</h1>
          <p className="text-gray-400">
            Discover the top-performing AI agents based on various metrics
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex gap-2">
                <Button
                  variant={sortField === 'rating' ? 'primary' : 'outline'}
                  size="sm"
                  icon={Star}
                  onClick={() => setSortField('rating')}
                >
                  Rating
                </Button>
                <Button
                  variant={sortField === 'deployments' ? 'primary' : 'outline'}
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => setSortField('deployments')}
                >
                  Usage
                </Button>
                <Button
                  variant={sortField === 'weekly_growth' ? 'primary' : 'outline'}
                  size="sm"
                  icon={TrendingUp}
                  onClick={() => setSortField('weekly_growth')}
                >
                  Growth
                </Button>
              </div>
            </div>

            <div className="md:ml-auto">
              <label className="block text-sm font-medium mb-2">Time Range</label>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('all')}
                >
                  All Time
                </Button>
                <Button
                  variant={timeRange === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('month')}
                >
                  This Month
                </Button>
                <Button
                  variant={timeRange === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('week')}
                >
                  This Week
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Rankings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-4 font-medium text-gray-400">Rank</th>
                <th className="text-left py-4 px-4 font-medium text-gray-400">Agent</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Rating</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Uses</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Growth</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {agents.map((agent, index) => (
                <tr 
                  key={agent.id}
                  className="group hover:bg-gray-900/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {index < 3 && <Crown className="w-5 h-5 text-[#e1ffa6]" />}
                      <span className={index < 3 ? "font-bold" : ""}>
                        #{index + 1}
                      </span>
                      {agent.rank_change !== 0 && getRankChangeIcon(agent.rank_change)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Link 
                      to={`/agent/${agent.slug}`}
                      className="flex items-center gap-4 group/link"
                    >
                      {agent.image_url ? (
                        <img 
                          src={agent.image_url} 
                          alt={agent.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium group-hover/link:text-[#e1ffa6] flex items-center gap-2">
                          {agent.name}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1">
                          {agent.description}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-4 h-4 text-[#e1ffa6]" fill="#e1ffa6" />
                      {agent.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatNumber(agent.deployments)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={
                      agent.weekly_growth > 0 
                        ? 'text-green-500' 
                        : agent.weekly_growth < 0 
                        ? 'text-red-500' 
                        : ''
                    }>
                      {agent.weekly_growth > 0 && '+'}
                      {agent.weekly_growth}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-2 py-1 bg-gray-800 rounded-full text-sm">
                      {agent.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No agents found for the selected criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rankings;