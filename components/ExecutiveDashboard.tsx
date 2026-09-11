import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Project } from '../types';
import Card from './ui/Card';
import { TrendingUpIcon, DownloadIcon, TrophyIcon, MoneyIcon } from './ui/Icons';
import { computePortfolioFinancials } from '../lib/economics';

interface ExecutiveDashboardProps {
  projects: Project[];
  internalRates: Record<string, number>;
  projectManagers: Record<string, { id: string; name: string }>;
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount);

const RISK_THRESHOLD = 30; // margin % below this (and >= 0) is "atención"

type HealthBucket = 'sano' | 'atencion' | 'critico' | 'sinPresupuesto';

const BUCKET_LABEL: Record<HealthBucket, string> = {
  sano: 'Sano',
  atencion: 'Atención',
  critico: 'Crítico',
  sinPresupuesto: 'Sin presupuesto',
};

const BUCKET_COLOR: Record<HealthBucket, string> = {
  sano: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  atencion: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  critico: 'text-red-400 border-red-500/30 bg-red-500/10',
  sinPresupuesto: 'text-gray-400 border-gray-600/40 bg-gray-700/20',
};

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ projects, internalRates, projectManagers }) => {
  const financials = useMemo(() => computePortfolioFinancials(projects, internalRates), [projects, internalRates]);

  const kpis = useMemo(() => {
    const totalCartera = financials.reduce((acc, f) => acc + f.totalBudget, 0);
    const totalFacturado = financials.reduce((acc, f) => acc + f.totalInvoiced, 0);
    const totalActualProfit = financials.reduce((acc, f) => acc + f.actualProfit, 0);
    const margenCartera = totalCartera > 0 ? (totalActualProfit / totalCartera) * 100 : 0;
    const enRiesgo = financials.filter((f) => f.totalBudget > 0 && f.actualProfitPercentage < RISK_THRESHOLD).length;
    return { totalCartera, totalFacturado, margenCartera, enRiesgo };
  }, [financials]);

  const healthBuckets = useMemo(() => {
    const buckets: Record<HealthBucket, { count: number; budget: number }> = {
      sano: { count: 0, budget: 0 },
      atencion: { count: 0, budget: 0 },
      critico: { count: 0, budget: 0 },
      sinPresupuesto: { count: 0, budget: 0 },
    };
    financials.forEach((f) => {
      let bucket: HealthBucket;
      if (f.totalBudget === 0) bucket = 'sinPresupuesto';
      else if (f.actualProfitPercentage < 0) bucket = 'critico';
      else if (f.actualProfitPercentage < RISK_THRESHOLD) bucket = 'atencion';
      else bucket = 'sano';
      buckets[bucket].count += 1;
      buckets[bucket].budget += f.totalBudget;
    });
    return buckets;
  }, [financials]);

  const managerRanking = useMemo(() => {
    const byManager = new Map<
      string,
      { name: string; projectCount: number; totalBudget: number; totalInvoiced: number; totalActualProfit: number }
    >();

    financials.forEach((f) => {
      const manager = projectManagers[f.project.id];
      const key = manager?.id || 'sin-asignar';
      const name = manager?.name || 'Sin asignar';
      const entry = byManager.get(key) || {
        name,
        projectCount: 0,
        totalBudget: 0,
        totalInvoiced: 0,
        totalActualProfit: 0,
      };
      entry.projectCount += 1;
      entry.totalBudget += f.totalBudget;
      entry.totalInvoiced += f.totalInvoiced;
      entry.totalActualProfit += f.actualProfit;
      byManager.set(key, entry);
    });

    return Array.from(byManager.values())
      .map((m) => ({
        ...m,
        pendiente: m.totalBudget - m.totalInvoiced,
        marginPercentage: m.totalBudget > 0 ? (m.totalActualProfit / m.totalBudget) * 100 : 0,
      }))
      .sort((a, b) => a.marginPercentage - b.marginPercentage);
  }, [financials, projectManagers]);

  const cashflowForecast = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; amount: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      months.push({ key, label, amount: 0 });
    }
    const monthIndex = new Map(months.map((m, i) => [m.key, i]));

    projects.forEach((p) => {
      (p.clientInfo?.plannedInvoices || []).forEach((pi) => {
        if (!pi.date) return;
        const key = pi.date.slice(0, 7);
        const idx = monthIndex.get(key);
        if (idx !== undefined) {
          months[idx].amount += pi.amount;
        }
      });
    });

    return months;
  }, [projects]);

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div id="executive-dashboard-print" className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUpIcon className="h-8 w-8 text-sky-400" />
            Dashboard Ejecutivo
          </h1>
          <p className="text-gray-400 mt-2 max-w-3xl text-sm">
            Vista consolidada de toda la cartera de proyectos — presupuesto, facturación, margen real y previsión de cobros.
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="print:hidden flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg"
        >
          <DownloadIcon className="h-4 w-4" />
          Descargar PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-sky-500">
          <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Presupuesto Total Cartera</p>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{formatEuro(kpis.totalCartera)}</p>
          <p className="text-xs text-gray-500 mt-1">{financials.length} proyectos activos/finalizados</p>
        </Card>
        <Card className="border-l-4 border-emerald-500">
          <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Facturado Total</p>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{formatEuro(kpis.totalFacturado)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {kpis.totalCartera > 0 ? ((kpis.totalFacturado / kpis.totalCartera) * 100).toFixed(1) : '0.0'}% del presupuesto
          </p>
        </Card>
        <Card className={`border-l-4 ${kpis.margenCartera >= RISK_THRESHOLD ? 'border-emerald-500' : 'border-amber-500'}`}>
          <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Margen Real de Cartera</p>
          <p className={`text-2xl font-bold mt-2 font-mono ${kpis.margenCartera >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {kpis.margenCartera.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Beneficio real / presupuesto total</p>
        </Card>
        <Card className="border-l-4 border-red-500">
          <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Proyectos en Riesgo</p>
          <p className="text-2xl font-bold text-red-400 mt-2 font-mono">{kpis.enRiesgo}</p>
          <p className="text-xs text-gray-500 mt-1">Margen real por debajo del {RISK_THRESHOLD}%</p>
        </Card>
      </div>

      {/* Health distribution */}
      <Card className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Salud del Portfolio</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(BUCKET_LABEL) as HealthBucket[]).map((bucket) => (
            <div key={bucket} className={`p-4 rounded-lg border ${BUCKET_COLOR[bucket]}`}>
              <p className="text-xs uppercase font-bold tracking-wider opacity-80">{BUCKET_LABEL[bucket]}</p>
              <p className="text-2xl font-bold mt-1">{healthBuckets[bucket].count}</p>
              <p className="text-xs mt-1 opacity-70 font-mono">{formatEuro(healthBuckets[bucket].budget)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Manager ranking */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-pink-500" />
            Ranking de Gestores
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-700">
                  <th className="py-2 pr-2">Gestor</th>
                  <th className="py-2 px-2 text-right">Proy.</th>
                  <th className="py-2 px-2 text-right">Presupuesto</th>
                  <th className="py-2 px-2 text-right">Pendiente</th>
                  <th className="py-2 pl-2 text-right">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {managerRanking.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500 text-xs">
                      No hay datos suficientes todavía.
                    </td>
                  </tr>
                )}
                {managerRanking.map((m) => (
                  <tr key={m.name}>
                    <td className="py-2 pr-2 text-white font-medium">{m.name}</td>
                    <td className="py-2 px-2 text-right text-gray-300 font-mono">{m.projectCount}</td>
                    <td className="py-2 px-2 text-right text-gray-300 font-mono">{formatEuro(m.totalBudget)}</td>
                    <td className="py-2 px-2 text-right text-gray-300 font-mono">{formatEuro(m.pendiente)}</td>
                    <td
                      className={`py-2 pl-2 text-right font-mono font-bold ${
                        m.marginPercentage >= RISK_THRESHOLD ? 'text-emerald-400' : m.marginPercentage >= 0 ? 'text-amber-400' : 'text-red-400'
                      }`}
                    >
                      {m.marginPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cashflow forecast */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MoneyIcon className="h-5 w-5 text-sky-400" />
            Previsión de Cobros (6 meses)
          </h2>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowForecast} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  formatter={(value: number) => [formatEuro(value), 'Previsto']}
                  labelStyle={{ color: '#fff', marginBottom: '0.5rem' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">Facturas planificadas por mes, de todos los proyectos</p>
        </Card>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @media print {
          body * { visibility: hidden; }
          #executive-dashboard-print, #executive-dashboard-print * { visibility: visible; }
          #executive-dashboard-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ExecutiveDashboard;
