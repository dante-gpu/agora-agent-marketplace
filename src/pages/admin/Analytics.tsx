import React from 'react';
import Card from '../../components/Card';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Total Users</h3>
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-sm text-green-500">+12% this week</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Active Users</h3>
          <p className="text-2xl font-bold">856</p>
          <p className="text-sm text-green-500">+5% this week</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Total Interactions</h3>
          <p className="text-2xl font-bold">45,678</p>
          <p className="text-sm text-green-500">+8% this week</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Avg. Response Time</h3>
          <p className="text-2xl font-bold">1.2s</p>
          <p className="text-sm text-red-500">+0.1s this week</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">Chart coming soon</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4">Bot Usage</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">Chart coming soon</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <div>
              <p className="font-medium">New User Registration</p>
              <p className="text-sm text-gray-400">john.doe@example.com</p>
            </div>
            <span className="text-sm text-gray-500">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <div>
              <p className="font-medium">Bot Interaction</p>
              <p className="text-sm text-gray-400">Assistant responded to query</p>
            </div>
            <span className="text-sm text-gray-500">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <div>
              <p className="font-medium">Content Report</p>
              <p className="text-sm text-gray-400">Inappropriate content reported</p>
            </div>
            <span className="text-sm text-gray-500">10 minutes ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;