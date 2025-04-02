import React, { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';

const Bots = () => {
  const { botAnalytics, loading, error, fetchBotAnalytics } = useAdminStore();

  useEffect(() => {
    fetchBotAnalytics();
  }, [fetchBotAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bot Analytics</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Total Interactions</h3>
          <p className="text-2xl font-bold">
            {botAnalytics.reduce((sum, bot) => sum + bot.total_interactions, 0).toLocaleString()}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Active Users Today</h3>
          <p className="text-2xl font-bold">
            {botAnalytics.reduce((sum, bot) => sum + bot.daily_active_users, 0).toLocaleString()}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Avg Response Time</h3>
          <p className="text-2xl font-bold">
            {(botAnalytics.reduce((sum, bot) => sum + bot.avg_response_time, 0) / botAnalytics.length || 0).toFixed(2)}s
          </p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Avg Accuracy</h3>
          <p className="text-2xl font-bold">
            {(botAnalytics.reduce((sum, bot) => sum + bot.accuracy_rating, 0) / botAnalytics.length || 0).toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-4 font-medium text-gray-400">Bot Name</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Interactions</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Response Time</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Accuracy</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Active Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {botAnalytics.map((bot) => (
                <tr key={bot.id} className="group hover:bg-gray-900/50">
                  <td className="py-4 px-4">{bot.name}</td>
                  <td className="py-4 px-4 text-right">{bot.total_interactions.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right">{bot.avg_response_time.toFixed(2)}s</td>
                  <td className="py-4 px-4 text-right">{bot.accuracy_rating.toFixed(1)}%</td>
                  <td className="py-4 px-4 text-right">{bot.daily_active_users.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Bots;