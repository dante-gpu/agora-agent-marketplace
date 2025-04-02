import React from 'react';
import { Search } from 'lucide-react';
import Input from './Input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchBarProps) => {
  return (
    <div className={`relative ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        icon={<Search className="w-5 h-5" />}
      />
    </div>
  );
};

export default SearchBar;