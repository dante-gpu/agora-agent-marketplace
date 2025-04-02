import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  glow?: boolean;
}

const Card = ({ children, className = '', hover = false, glass = false, glow = false }: CardProps) => {
  return (
    <div
      className={`
        relative rounded-xl p-6 transition-all duration-300
        ${glass 
          ? 'bg-white/5 backdrop-blur-lg border border-white/10' 
          : 'bg-gray-900/50 border border-gray-800/50'
        }
        ${hover && 'hover:scale-[1.02] hover:bg-gray-900/80'}
        ${glow && 'after:absolute after:inset-0 after:rounded-xl after:bg-[#e1ffa6]/5 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:-z-10 after:blur-xl'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;