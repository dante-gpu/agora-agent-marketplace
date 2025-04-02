import React from 'react';
import { Search, Menu, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="border-b border-gray-800 sticky top-0 bg-black/95 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold">AgentHub</Link>
            <div className="hidden lg:flex items-center gap-6">
              <Link 
                to="/explore" 
                className={`${location.pathname === '/explore' ? 'text-white' : 'text-gray-400'} hover:text-white transition-colors`}
              >
                Explore
              </Link>
              <Link 
                to="/categories" 
                className={`${location.pathname === '/categories' ? 'text-white' : 'text-gray-400'} hover:text-white transition-colors`}
              >
                Categories
              </Link>
              {user && (
                <Link 
                  to="/create" 
                  className={`${location.pathname === '/create' ? 'text-white' : 'text-gray-400'} hover:text-white transition-colors`}
                >
                  Create
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:border-[#e1ffa6]"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={handleSignOut}
                  className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-secondary hidden md:block">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary hidden md:block">
                  Sign Up
                </Link>
              </>
            )}
            <button className="md:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;