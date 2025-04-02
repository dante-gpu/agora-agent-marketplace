import React, { useState } from 'react';
import { Search, Menu, MessageSquare, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import UserMenu from './UserMenu';
import SearchBar from './SearchBar';
import Button from './Button';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { showQuickChat, showTokenPrice, toggleQuickChat, toggleTokenPrice } = useUIStore();

  const navLinks = [
    { path: '/explore', label: 'Explore' },
    { path: '/categories', label: 'Categories' },
    { path: '/rankings', label: 'Rankings' },
    { path: '/discussions', label: 'Discussions', icon: MessageSquare },
    ...(user ? [{ path: '/create', label: 'Create' }] : []),
  ];

  return (
    <nav className="border-b border-gray-800 sticky top-0 bg-black/95 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl md:text-3xl font-bold text-[#e1ffa6] font-['Space Grotesk']">
              Agora
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link 
                  key={path}
                  to={path} 
                  className={`${location.pathname === path ? 'text-white' : 'text-gray-400'} hover:text-white transition-colors`}
                >
                  {Icon ? (
                    <div className="flex items-center gap-1">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  ) : (
                    label
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search agents..."
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleQuickChat}
                className={showQuickChat ? 'text-[#e1ffa6]' : 'text-gray-400'}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTokenPrice}
                className={showTokenPrice ? 'text-[#e1ffa6]' : 'text-gray-400'}
              >
                <Wallet className="w-5 h-5" />
              </Button>
            </div>
            <div className="hidden md:block">
              <UserMenu />
            </div>
            <button 
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="py-4 space-y-4">
              <div className="px-2">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search agents..."
                />
              </div>
              
              <div className="border-t border-gray-800 pt-4">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      location.pathname === path 
                        ? 'bg-[#e1ffa6] text-black' 
                        : 'text-gray-400 hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="px-4 py-2">
                  <UserMenu />
                </div>
                <div className="flex items-center gap-4 px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleQuickChat();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 ${showQuickChat ? 'text-[#e1ffa6]' : 'text-gray-400'}`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Quick Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleTokenPrice();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 ${showTokenPrice ? 'text-[#e1ffa6]' : 'text-gray-400'}`}
                  >
                    <Wallet className="w-5 h-5" />
                    Token Price
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;