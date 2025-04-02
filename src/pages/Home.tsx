import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Zap, ChevronRight, ToggleLeft as Google, Bot, Brain, Code, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import AgentCard from '../components/AgentCard';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import QuickChat from '../components/QuickChat';
import * as Icons from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  price: number;
  creator: string;
  image_url: string;
  category: string;
  rating: number;
  deployments: number;
  slug: string;
}

interface Category {
  name: string;
  description: string;
  icon: string;
  count: number;
}

const features = [
  {
    icon: Bot,
    title: "Advanced AI Agents",
    description: "Specialized AI agents trained for specific tasks and domains"
  },
  {
    icon: Brain,
    title: "Neural Processing",
    description: "State-of-the-art neural networks for intelligent responses"
  },
  {
    icon: Code,
    title: "Code Generation",
    description: "Generate high-quality code across multiple languages"
  }
];

function Home() {
  const { user } = useAuthStore();
  const [popularAgents, setPopularAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    avgRating: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch categories with agent counts
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('name, description, icon');

        if (categoryError) throw categoryError;

        // Fetch agent counts for each category
        const categoryCounts = await Promise.all(
          categoryData.map(async (category) => {
            const { count } = await supabase
              .from('agents')
              .select('*', { count: 'exact', head: true })
              .eq('category', category.name)
              .eq('status', 'active');

            return {
              ...category,
              count: count || 0
            };
          })
        );

        setCategories(categoryCounts);

        // Fetch popular agents
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .order('deployments', { ascending: false })
          .limit(4);

        if (agentError) throw agentError;
        setPopularAgents(agentData || []);

        // Fetch stats
        const { count: agentCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        const { data: ratingData } = await supabase
          .from('agents')
          .select('rating')
          .eq('status', 'active');

        const avgRating = ratingData?.reduce((sum, agent) => sum + agent.rating, 0) || 0;
        const totalRating = avgRating / (ratingData?.length || 1);

        setStats({
          totalAgents: agentCount || 0,
          totalUsers: userCount || 0,
          avgRating: totalRating
        });

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Dynamic icon component lookup
  const getIconComponent = (iconName: string) => {
    return (Icons as Record<string, Icons.LucideIcon>)[iconName] || Icons.HelpCircle;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#e1ffa6]/5 to-transparent" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#e1ffa6]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#e1ffa6]/5 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {!user && (
              <div className="flex justify-center mb-8">
                <Button 
                  variant="outline"
                  icon={Google}
                  onClick={() => console.log('Google sign in')}
                  className="bg-black/50 backdrop-blur-lg border-[#e1ffa6]/30 hover:border-[#e1ffa6]"
                >
                  Continue with Google
                </Button>
              </div>
            )}

            <div className="mb-8">
              <Badge variant="success" size="md" glass>Powered by DanteGPU</Badge>
            </div>

            <h1 className="font-['Space Grotesk'] text-5xl md:text-7xl font-bold leading-tight">
              <div className="space-y-4">
                <span className="relative block">
                  <span className="relative z-10">Discover AI Agents for</span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#e1ffa6]/20 to-transparent blur-lg"></div>
                </span>
                <span className="relative block">
                  <span className="relative z-10">Every Task</span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#e1ffa6]/20 to-transparent blur-lg"></div>
                </span>
              </div>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto mt-8">
              Access thousands of specialized AI agents to help you with writing, coding, research, and more.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="w-full md:w-auto">
                Get Started
              </Button>
              <Button variant="outline" size="lg" glass className="w-full md:w-auto">
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stats.totalAgents}</div>
                <div className="text-gray-400">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stats.totalUsers}</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2 flex items-center justify-center gap-1">
                  <Star className="w-6 h-6 text-[#e1ffa6]" fill="#e1ffa6" />
                  {stats.avgRating.toFixed(1)}
                </div>
                <div className="text-gray-400">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#e1ffa6]/5" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} glass className="backdrop-blur-xl">
                <feature.icon className="w-12 h-12 text-[#e1ffa6] mb-6" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Chat Section */}
      <QuickChat />

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Browse by Category</h2>
            <Link 
              to="/categories"
              className="flex items-center text-[#e1ffa6] hover:opacity-80"
            >
              All Categories <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
              {error}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.slice(0, 4).map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <Link 
                    to={`/explore?category=${encodeURIComponent(category.name)}`}
                    key={category.name} 
                    className="group"
                  >
                    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-[#e1ffa6] transition-all duration-200 h-full group-hover:scale-[1.02]">
                      <IconComponent className="w-8 h-8 text-[#e1ffa6] mb-4" />
                      <h3 className="text-xl font-bold mb-2 group-hover:text-[#e1ffa6] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-400 mb-2">{category.description}</p>
                      <p className="text-sm text-gray-500">{category.count} agents</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Popular Agents Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Popular Agents</h2>
            <Link 
              to="/explore"
              className="flex items-center text-[#e1ffa6] hover:opacity-80"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
              {error}
            </div>
          ) : popularAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No agents available</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularAgents.map((agent) => (
                <Link to={`/agent/${agent.slug}`} key={agent.id}>
                  <AgentCard
                    name={agent.name}
                    description={agent.description}
                    uses={agent.deployments.toString()}
                    rating={agent.rating}
                    category={agent.category}
                    price={agent.price}
                    imageUrl={agent.image_url}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#e1ffa6]/10 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Create Your Own AI Agent</h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Build and customize AI agents tailored to your specific needs. Share them with the community or keep them private.
              </p>
              <Link to={user ? "/create" : "/signin"}>
                <Button size="lg">
                  {user ? "Start Creating" : "Sign in to Create"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;