import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Search, CheckCircle2, XCircle, Filter } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { auditLogs, apps } = useApp();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesSearch =
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.requestId.toLowerCase().includes(search.toLowerCase());
      return matchesAction && matchesSearch;
    });
  }, [auditLogs, filterAction, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          System Audit & Activity Trail
        </h2>
        <p className="text-xs text-neutral-500">
          Append-only records of all administrative actions, publications, rollbacks, and mutations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search details or request ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
          <span className="text-neutral-500">Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-8.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="version.published">version.published</option>
            <option value="version.rollback">version.rollback</option>
            <option value="app.created">app.created</option>
            <option value="app.updated">app.updated</option>
            <option value="app.archived">app.archived</option>
            <option value="app.deleted">app.deleted</option>
            <option value="config.updated">config.updated</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredLogs.map((log) => {
                const isSuccess = log.result === 'success';
                const formattedDate = new Date(log.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr key={log.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {formattedDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-900 dark:text-white">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500 truncate max-w-[140px]">
                      {log.actorEmail}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 max-w-sm leading-relaxed">
                      {log.details}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {log.requestId}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-medium capitalize text-[11px] ${
                          isSuccess
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{log.result}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
