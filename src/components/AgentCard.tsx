import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';

interface AgentCardProps {
  name: string;
  description: string;
  uses: string;
  rating: number;
  category: string;
  price?: number;
  imageUrl?: string;
}

const AgentCard = ({
  name,
  description,
  uses,
  rating,
  category,
  price = 0,
  imageUrl,
}: AgentCardProps) => {
  return (
    <Card 
      hover 
      glow 
      glass 
      className="group cursor-pointer h-full relative overflow-hidden"
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#e1ffa6]/5 rounded-full blur-2xl group-hover:bg-[#e1ffa6]/10 transition-colors" />
      
      {imageUrl && (
        <div className="aspect-square rounded-lg overflow-hidden mb-4">
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
            <h3 className="font-bold group-hover:text-[#e1ffa6] transition-colors duration-300">
              {name}
            </h3>
            <Badge size="sm" glass>{category}</Badge>
          </div>
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#e1ffa6] transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Chat</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#e1ffa6]/10 text-[#e1ffa6] px-2.5 py-1 rounded-full">
              <Star className="w-4 h-4" fill="#e1ffa6" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400">{uses} uses</span>
          </div>
          
          {price > 0 && (
            <div className="bg-gray-800/50 px-3 py-1 rounded-full text-[#e1ffa6] group-hover:bg-[#e1ffa6]/10 transition-colors">
              ${price.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AgentCard;