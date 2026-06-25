import React, { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AuditLog {
  id: string;
  performed_by: string;
  section: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string;
  old_value: any;
  new_value: any;
  meta: any;
  created_at: string;
}

export const MasterAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
      } else {
        setError(data.detail || 'Failed to fetch logs');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDetails = (log: AuditLog) => {
    if (!log.new_value) return '-';
    try {
      const val = typeof log.new_value === 'string' ? JSON.parse(log.new_value) : log.new_value;
      
      // If we have a custom human-readable message from the frontend, prioritize it!
      if (val._audit_msg) {
        return val._audit_msg;
      }

      if (log.entity_type.includes('body-type') && !log.entity_type.includes('sub')) {
        if (log.action === 'PUT') return `Mapped "${val.car_name}" (${val.brand_name}) to Body Type: "${val.body_type}"`;
        if (log.action === 'DELETE') return `Removed mapping for "${val.car_name}" (${val.brand_name})`;
      }
      if (log.entity_type.includes('sub-body-type')) {
        return `Changed Sub Body Type of "${val.car_name}" (${val.brand_name}) to "${val.sub_body_type || 'None'}"`;
      }
      if (log.entity_type.includes('master-values')) {
        if (log.action === 'POST') return `Added new Master Value: "${val.value}" in Category: "${val.category}"`;
      }
      if (log.entity_type.includes('new-models')) {
         if (val.name) return `Added New Model: "${val.name}" (${val.body_type})`;
         if (val.sub_body_type !== undefined) return `Updated Model Body Type to "${val.body_type}", Sub Type to "${val.sub_body_type}"`;
      }

      if (log.entity_type.includes('features/master')) {
        if (log.action === 'POST' && log.entity_type.includes('/merge')) return `Merged features into Category: "${val.target_category}" under Target Feature: "${val.target_name}"`;
        if (log.action === 'POST') return `Added new Feature: "${val.name}" in Category: "${val.category}"`;
        if (log.action === 'PATCH' && log.entity_type.includes('rename')) return `Renamed Feature to: "${val.new_name}"`;
        if (log.action === 'PATCH' && log.entity_type.includes('move')) return `Moved Feature to Category: "${val.new_category}"`;
      }

      const keys = Object.keys(val).filter(k => val[k] !== null && val[k] !== undefined && val[k] !== '');
      if (keys.length > 0) {
         return `Updated properties: ` + keys.map(k => `${k.replace(/_/g, ' ')}: ${val[k]}`).join(', ');
      }
      return JSON.stringify(val);
    } catch (e) {
      return typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : String(log.new_value);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f5f5] p-5 font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto bg-white border border-[#ccc] rounded-sm shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eee]">
          <h2 className="text-lg font-bold text-[#0a385c]">Master Page Action Logs</h2>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f2fa] text-[#0a385c] hover:bg-[#d4e6f6] rounded-sm font-semibold text-sm transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-sm text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border border-[#bbb] rounded-sm custom-scrollbar">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead className="bg-[#e2e2e2] sticky top-0">
              <tr>
                <th className="border-b border-r border-[#bbb] px-3 py-2 font-bold whitespace-nowrap">Timestamp</th>
                <th className="border-b border-r border-[#bbb] px-3 py-2 font-bold whitespace-nowrap">User</th>
                <th className="border-b border-r border-[#bbb] px-3 py-2 font-bold whitespace-nowrap">Action</th>
                <th className="border-b border-r border-[#bbb] px-3 py-2 font-bold whitespace-nowrap">Entity Name</th>
                <th className="border-b border-[#bbb] px-3 py-2 font-bold">Details (Payload)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#eee] hover:bg-slate-50 transition-colors">
                  <td className="border-r border-[#eee] px-3 py-2 whitespace-nowrap text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="border-r border-[#eee] px-3 py-2 font-semibold">
                    <span className="text-slate-400 font-normal mr-1">Admin User -</span>
                    {log.performed_by}
                  </td>
                  <td className="border-r border-[#eee] px-3 py-2 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="border-r border-[#eee] px-3 py-2 font-medium">
                    {log.entity_name}
                  </td>
                  <td className="px-3 py-2 text-[13px] text-slate-700">
                    {formatDetails(log)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 italic">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterAuditLog;
