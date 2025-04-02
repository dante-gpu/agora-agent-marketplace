import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, ArrowLeft, X, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import AgentCard from '../components/AgentCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';

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
  is_official: boolean;
}

interface FilterState {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sortBy: 'newest' | 'rating' | 'deployments' | 'price';
  showOfficial: boolean;
  showCommunity: boolean;
}

const categories = [
  "Writing",
  "Programming",
  "Research",
  "Knowledge",
  "Business",
  "Math",
  "Design",
  "Music"
];

function Explore() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';

  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'newest',
    showOfficial: true,
    showCommunity: true,
  });

  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        let query = supabase
          .from('agents')
          .select('*')
          .eq('status', 'active');

        // Apply category filter
        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        // Apply search query
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply price filters
        if (filters.minPrice) {
          query = query.gte('price', parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
          query = query.lte('price', parseFloat(filters.maxPrice));
        }

        // Apply rating filter
        if (filters.minRating) {
          query = query.gte('rating', parseFloat(filters.minRating));
        }

        // Apply official/community filters
        if (filters.showOfficial && !filters.showCommunity) {
          query = query.eq('is_official', true);
        } else if (!filters.showOfficial && filters.showCommunity) {
          query = query.eq('is_official', false);
        } else if (!filters.showOfficial && !filters.showCommunity) {
          // If neither is selected, return no results
          setAgents([]);
          setLoading(false);
          return;
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'deployments':
            query = query.order('deployments', { ascending: false });
            break;
          case 'price':
            query = query.order('price', { ascending: true });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        setAgents(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, [searchQuery, categoryFilter, filters]);

  const handleSearch = (value: string) => {
    if (value) {
      searchParams.set('q', value);
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'newest',
      showOfficial: true,
      showCommunity: true,
    });
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
      <div className="flex flex-col gap-6 mb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Explore AI Agents</h1>
            {categoryFilter && (
              <div className="flex items-center gap-2 mt-2">
                <Link 
                  to="/explore"
                  className="text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  All Categories
                </Link>
                <span className="text-gray-600">•</span>
                <Badge>{categoryFilter}</Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <Link to="/create">
                <Button icon={Plus}>
                  Create Agent
                </Button>
              </Link>
            )}
            <Button 
              variant={showFilters ? "primary" : "outline"} 
              icon={showFilters ? X : SlidersHorizontal}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search agents..."
          />

          {showFilters && (
            <Card>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-[#e1ffa6] hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSearchParams({ category: cat })}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          categoryFilter === cat
                            ? 'bg-[#e1ffa6] text-black'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Range</label>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                        className="w-full bg-black border border-gray-800 rounded-lg p-2 focus:outline-none focus:border-[#e1ffa6]"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                        className="w-full bg-black border border-gray-800 rounded-lg p-2 focus:outline-none focus:border-[#e1ffa6]"
                      />
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters(f => ({ ...f, minRating: e.target.value }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2 focus:outline-none focus:border-[#e1ffa6]"
                    >
                      <option value="">Any</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as FilterState['sortBy'] }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-2 focus:outline-none focus:border-[#e1ffa6]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="rating">Highest Rated</option>
                      <option value="deployments">Most Used</option>
                      <option value="price">Lowest Price</option>
                    </select>
                  </div>

                  {/* Agent Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Agent Type</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.showOfficial}
                          onChange={(e) => setFilters(f => ({ ...f, showOfficial: e.target.checked }))}
                          className="rounded border-gray-800 text-[#e1ffa6] focus:ring-[#e1ffa6]"
                        />
                        Official Agents
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.showCommunity}
                          onChange={(e) => setFilters(f => ({ ...f, showCommunity: e.target.checked }))}
                          className="rounded border-gray-800 text-[#e1ffa6] focus:ring-[#e1ffa6]"
                        />
                        Community Agents
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Results */}
      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No agents found</p>
          {user ? (
            <Link to="/create">
              <Button variant="primary" icon={Plus}>
                Create Your First Agent
              </Button>
            </Link>
          ) : (
            <Link to="/signin">
              <Button variant="primary">
                Sign in to Create an Agent
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
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
  );
}

export default Explore;