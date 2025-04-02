import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Bot, Shield, BarChart } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/bots', icon: Bot, label: 'Bots' },
    { path: '/admin/moderation', icon: Shield, label: 'Moderation' },
    { path: '/admin/analytics', icon: BarChart, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <div className="bg-gray-900 rounded-xl p-4">
              <h2 className="text-xl font-bold px-4 mb-4">Admin Panel</h2>
              <nav className="space-y-1">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      flex items-center gap-3 px-4 py-2 rounded-lg
                      ${location.pathname === path
                        ? 'bg-[#e1ffa6] text-black'
                        : 'text-gray-400 hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;