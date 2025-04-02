import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Pencil, Code, Brain, Briefcase, Calculator, Palette, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';

interface CategoryCount {
  name: string;
  description: string;
  icon: string;
  count: number;
}

const categoryIcons = {
  "Writing": Pencil,
  "Programming": Code,
  "Research": Brain,
  "Knowledge": Bookmark,
  "Business": Briefcase,
  "Math": Calculator,
  "Design": Palette,
  "Music": Music
};

const categoryDescriptions = {
  "Writing": "Content creation, editing, and writing assistance",
  "Programming": "Code generation, debugging, and development tools",
  "Research": "Data analysis, academic research, and fact-checking",
  "Knowledge": "Information retrieval and learning assistance",
  "Business": "Business analysis, strategy, and planning",
  "Math": "Mathematical calculations and problem-solving",
  "Design": "Graphic design, UI/UX, and creative assistance",
  "Music": "Music composition, analysis, and theory"
};

function Categories() {
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategoryCounts() {
      try {
        setLoading(true);
        
        // Get all categories with their descriptions and icons
        const categories = Object.keys(categoryIcons).map(name => ({
          name,
          description: categoryDescriptions[name as keyof typeof categoryDescriptions],
          icon: name,
          count: 0
        }));

        // Fetch agent counts for each category
        const counts = await Promise.all(
          categories.map(async (category) => {
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

        // Sort by count in descending order
        const sortedCounts = counts.sort((a, b) => b.count - a.count);
        setCategoryCounts(sortedCounts);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryCounts();
  }, []);

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
      <h1 className="text-3xl font-bold mb-8">Browse by Category</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categoryCounts.map((category) => {
          const Icon = categoryIcons[category.name as keyof typeof categoryIcons];
          return (
            <Link 
              to={`/explore?category=${encodeURIComponent(category.name)}`}
              key={category.name}
              className="group"
            >
              <Card 
                hover 
                glow 
                glass 
                className="h-full relative overflow-hidden group-hover:border-[#e1ffa6]/50"
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#e1ffa6]/5 rounded-full blur-2xl group-hover:bg-[#e1ffa6]/10 transition-colors" />
                
                <div className="relative">
                  <div className="bg-[#e1ffa6]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#e1ffa6]" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#e1ffa6] transition-colors">
                    {category.name}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {category.count} {category.count === 1 ? 'agent' : 'agents'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center group-hover:bg-[#e1ffa6]/10 transition-colors">
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#e1ffa6] transition-colors" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Categories;