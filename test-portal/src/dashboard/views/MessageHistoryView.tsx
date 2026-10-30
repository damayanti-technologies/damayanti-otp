import React, { useState, useEffect } from 'react';
import { History, CheckCircle, Clock, XCircle, RefreshCw, Smartphone } from 'lucide-react';
import { api } from '../services/api';
import { SmsMessage } from '../types';

export const MessageHistoryView: React.FC = () => {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.getMessages(p, 20);
      setMessages(res.messages);
      setTotal(res.total);
      setPage(p);
    } catch (e) {
      console.error('Failed to load message history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(1);
  }, []);

  const getStatusBadge = (status: SmsMessage['status']) => {
    const map = {
      SUBMITTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      SENDING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      ASSIGNED: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
      QUEUED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      EXPIRED: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] || map.QUEUED}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            SMS Job Transmission History
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time delivery status logs recorded from our Samsung Galaxy A35 Android BSNL transmitter.
          </p>
        </div>

        <button
          onClick={() => fetchMessages(page)}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#161D31] hover:bg-[#1E2742] text-xs font-semibold text-gray-300 border border-[#2B354F] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#12182B] text-gray-400 font-semibold border-b border-[#1F2937] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Application</th>
                <th className="py-3.5 px-4">Device</th>
                <th className="py-3.5 px-4">Retries</th>
                <th className="py-3.5 px-4">Created Time</th>
                <th className="py-3.5 px-4">Submitted Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No SMS messages transmitted yet. Real traffic will populate here automatically.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-[#141B30] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">{msg.recipientNumber}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(msg.status)}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-300">{msg.application?.name || 'Damayanti System'}</td>
                    <td className="py-3.5 px-4 text-gray-400">{msg.device?.name || 'BSNL Galaxy A35'}</td>
                    <td className="py-3.5 px-4 font-mono">{msg.retryCount}</td>
                    <td className="py-3.5 px-4 text-gray-400">{new Date(msg.createdAt).toLocaleTimeString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {msg.submittedAt ? new Date(msg.submittedAt).toLocaleTimeString('en-IN') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
