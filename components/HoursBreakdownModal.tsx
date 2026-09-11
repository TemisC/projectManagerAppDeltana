import React, { useState, useMemo } from 'react';
import type { ActualTimeLog, TeamMember } from '../types';

interface HoursBreakdownModalProps {
  title: string;
  projectName: string;
  memberName?: string;
  defaultRate?: number;
  globalRates?: Record<string, number>;
  actualLogs?: ActualTimeLog[];
  teamMembers?: TeamMember[];
  onClose: () => void;
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

export const HoursBreakdownModal: React.FC<HoursBreakdownModalProps> = ({
  title,
  projectName,
  memberName,
  defaultRate = 0,
  globalRates = {},
  actualLogs = [],
  teamMembers = [],
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'logs'>('monthly');

  // Build a member rate resolver map
  const memberRatesMap = useMemo(() => {
    const map = new Map<string, number>();
    teamMembers.forEach((m) => {
      const key = m.name.toLowerCase().trim();
      const info = m.internalCostInfo;
      const rate = info && info.hourlyRate > 0 ? info.hourlyRate : globalRates[m.contact] || defaultRate;
      map.set(key, rate);
    });
    return map;
  }, [teamMembers, globalRates, defaultRate]);

  // Aggregate monthly actual data
  const monthlyActualData = useMemo(() => {
    if (!actualLogs || actualLogs.length === 0) return [];

    const map = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalHours: number;
        totalCostEuro: number;
        logCount: number;
        memberBreakdown: Map<string, { memberName: string; hours: number; rate: number; costEuro: number }>;
        logs: ActualTimeLog[];
      }
    >();

    actualLogs.forEach((log) => {
      if (!log.date) return;
      const monthKey = log.date.substring(0, 7); // "YYYY-MM"
      const [y, m] = monthKey.split('-').map(Number);
      if (!y || !m) return;

      const dateObj = new Date(y, m - 1, 1);
      const monthName = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        : monthKey;
      const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      const empKey = log.employeeName.toLowerCase().trim();
      const rate = memberRatesMap.get(empKey) || defaultRate;
      const logCost = log.hours * rate;

      let monthEntry = map.get(monthKey);
      if (!monthEntry) {
        monthEntry = {
          monthKey,
          monthLabel: capitalized,
          totalHours: 0,
          totalCostEuro: 0,
          logCount: 0,
          memberBreakdown: new Map(),
          logs: [],
        };
        map.set(monthKey, monthEntry);
      }

      monthEntry.totalHours += log.hours;
      monthEntry.totalCostEuro += logCost;
      monthEntry.logCount += 1;
      monthEntry.logs.push(log);

      // Member breakdown inside month
      const existingMember = monthEntry.memberBreakdown.get(empKey) || {
        memberName: log.employeeName,
        hours: 0,
        rate,
        costEuro: 0,
      };
      existingMember.hours += log.hours;
      existingMember.costEuro += logCost;
      monthEntry.memberBreakdown.set(empKey, existingMember);
    });

    return Array.from(map.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((item) => ({
        ...item,
        memberBreakdownList: Array.from(item.memberBreakdown.values()),
      }));
  }, [actualLogs, memberRatesMap, defaultRate]);

  // Total summary calculations
  const totalActualHours = useMemo(() => {
    return monthlyActualData.reduce((acc, m) => acc + m.totalHours, 0);
  }, [monthlyActualData]);

  const totalActualEuro = useMemo(() => {
    return monthlyActualData.reduce((acc, m) => acc + m.totalCostEuro, 0);
  }, [monthlyActualData]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gray-900 border-b border-gray-700 flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider font-mono">
              {projectName} {memberName ? `• ${memberName}` : ''}
            </span>
            <h3 className="font-bold text-xl text-white mt-0.5">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Summary KPI Cards */}
        <div className="p-4 bg-gray-850 border-b border-gray-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-700">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Horas</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{totalActualHours.toFixed(1)} h</p>
          </div>
          <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-700">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Importe en Euros</p>
            <p className="text-xl font-mono font-bold text-sky-400">{formatEuro(totalActualEuro)}</p>
          </div>
          <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-700 col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Tarifa Media / Aplicada</p>
            <p className="text-xl font-mono font-bold text-orange-400">
              {totalActualHours > 0 ? formatEuro(totalActualEuro / totalActualHours) + '/h' : formatEuro(defaultRate) + '/h'}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-700 bg-gray-900 px-4">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'monthly'
                ? 'border-sky-500 text-sky-400 bg-gray-800/50'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📊 Resumen Mes a Mes ({monthlyActualData.length} meses)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'logs'
                ? 'border-sky-500 text-sky-400 bg-gray-800/50'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📄 Registros Detallados ({actualLogs.length})
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-gray-300">
          {activeTab === 'monthly' && (
            <div>
              {monthlyActualData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  No hay registros de fichaje para generar el desglose mensual.
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyActualData.map((m) => {
                    const monthPercentage = totalActualHours > 0 ? (m.totalHours / totalActualHours) * 100 : 0;

                    return (
                      <div
                        key={m.monthKey}
                        className="p-4 bg-gray-900/70 rounded-xl border border-gray-700/80 hover:border-sky-500/50 transition-colors shadow-md"
                      >
                        {/* Month Header Row */}
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                          <div>
                            <span className="text-base font-bold text-white flex items-center gap-2">
                              🗓️ {m.monthLabel}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              {m.logCount} fichajes registrados ({monthPercentage.toFixed(1)}% del total)
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="text-xs text-gray-400 block font-mono">Horas</span>
                              <span className="text-lg font-bold font-mono text-emerald-400">{m.totalHours.toFixed(1)} h</span>
                            </div>
                            <div className="pl-3 border-l border-gray-700">
                              <span className="text-xs text-gray-400 block font-mono">Importe €</span>
                              <span className="text-lg font-bold font-mono text-sky-400">{formatEuro(m.totalCostEuro)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-3">
                          <div
                            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, monthPercentage)}%` }}
                          />
                        </div>

                        {/* Breakdown by resource within this month */}
                        {m.memberBreakdownList.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-800 space-y-1.5">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                              Recursos en este mes ({m.memberBreakdownList.length}):
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {m.memberBreakdownList.map((mb) => (
                                <div
                                  key={mb.memberName}
                                  className="flex justify-between items-center p-2 bg-gray-800/80 rounded border border-gray-700/50 text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-gray-200 block">{mb.memberName}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">Tarifa: {formatEuro(mb.rate)}/h</span>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-emerald-400 font-bold block">{mb.hours.toFixed(1)} h</span>
                                    <span className="text-sky-300 font-bold text-xs">{formatEuro(mb.costEuro)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              {actualLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">No hay fichajes disponibles.</div>
              ) : (
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] border-b border-gray-700 sticky top-0">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Empleado / Recurso</th>
                        <th className="py-3 px-4">Proyecto Ref.</th>
                        <th className="py-3 px-4 text-right">Horas</th>
                        <th className="py-3 px-4 text-right">Tarifa €/h</th>
                        <th className="py-3 px-4 text-right">Importe €</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 font-mono">
                      {actualLogs.map((log) => {
                        const empKey = log.employeeName.toLowerCase().trim();
                        const rate = memberRatesMap.get(empKey) || defaultRate;
                        const cost = log.hours * rate;

                        return (
                          <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="py-2.5 px-4 text-gray-300">{log.date}</td>
                            <td className="py-2.5 px-4 text-white font-sans font-medium">{log.employeeName}</td>
                            <td className="py-2.5 px-4 text-gray-400 text-[11px]">{log.projectNameRef || '-'}</td>
                            <td
                              className={`py-2.5 px-4 text-right font-bold ${
                                log.hours >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {log.hours > 0 ? `+${log.hours.toFixed(1)}` : log.hours.toFixed(1)} h
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-400">{formatEuro(rate)}</td>
                            <td className="py-2.5 px-4 text-right text-sky-300 font-bold">{formatEuro(cost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            * Importes calculados multiplicando horas fichadas por tarifa horaria asignada.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
