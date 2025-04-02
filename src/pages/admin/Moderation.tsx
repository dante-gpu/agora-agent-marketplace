import React, { useEffect } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';

const Moderation = () => {
  const { reports, loading, error, fetchReports, resolveReport, deleteMessage } = useAdminStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId: string, messageId: string) => {
    await deleteMessage(messageId, 'Content violation');
    await resolveReport(reportId, 'resolve');
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <span>{reports.filter(r => r.status === 'pending').length} pending reports</span>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{report.reporter.username}</span>
                  <span className="text-gray-400">reported a message</span>
                  <span className="text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-gray-300">{report.message.content}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Posted {new Date(report.message.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Reason for Report</h3>
                  <p className="text-gray-400">{report.reason}</p>
                </div>
              </div>
              {report.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={X}
                    onClick={() => resolveReport(report.id, 'dismiss')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Check}
                    onClick={() => handleResolve(report.id, report.message.id)}
                  >
                    Remove Content
                  </Button>
                </div>
              )}
              {report.status !== 'pending' && (
                <div className="px-3 py-1 rounded-full text-sm">
                  {report.status === 'resolved' ? (
                    <span className="text-green-500">Resolved</span>
                  ) : (
                    <span className="text-gray-500">Dismissed</span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        {reports.length === 0 && (
          <Card>
            <p className="text-center text-gray-400">No reports to review</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Moderation;