import { useState, useEffect } from 'react';
import { apiClient } from '../adapters/infrastructure/apiClient';
import type { RouteDTO } from '../adapters/infrastructure/apiClient.ts';


export default function RoutesTab() {
  const [routes, setRoutes] = useState<RouteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    vesselType: '',
    fuelType: '',
    year: '',
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async (routeId: string) => {
    try {
      await apiClient.setBaseline(routeId);
      await loadRoutes(); // Reload to update baseline status
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set baseline');
    }
  };

  const filteredRoutes = routes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year.toString() !== filters.year) return false;
    return true;
  });

  const uniqueVesselTypes = [...new Set(routes.map((r) => r.vesselType))];
  const uniqueFuelTypes = [...new Set(routes.map((r) => r.fuelType))];
  const uniqueYears = [...new Set(routes.map((r) => r.year.toString()))].sort();

  if (loading) {
    return <div className="text-center py-8">Loading routes...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Route Management</h2>
        <span className="text-sm text-slate-400">View and manage ship route data</span>
      </div>

      {/* Filters */}
      <div className="bg-navy-800/50 backdrop-blur border border-navy-700 p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Vessel Type</label>
          <select
            value={filters.vesselType}
            onChange={(e) => setFilters({ ...filters, vesselType: e.target.value })}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">All Vessel Types</option>
            {uniqueVesselTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Fuel Type</label>
          <select
            value={filters.fuelType}
            onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">All Fuels</option>
            {uniqueFuelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Year</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden shadow-xl shadow-navy-950/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy-700">
            <thead className="bg-navy-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-ocean-400 uppercase tracking-wider">
                  Route ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Vessel Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fuel Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  GHG Intensity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fuel Cons.
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Emissions
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700 bg-navy-800">
              {filteredRoutes.map((route) => (
                <tr key={route.routeId} className="hover:bg-navy-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {route.routeId}
                    {route.isBaseline && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] bg-ocean-500/10 text-ocean-400 border border-ocean-500/20 rounded uppercase tracking-wide">
                        Baseline
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{route.vesselType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{route.fuelType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{route.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <span className="font-mono text-ocean-200">{route.ghgIntensity.toFixed(2)}</span>
                    <span className="text-xs text-slate-500 ml-1">gCO₂e/MJ</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {route.fuelConsumption.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {route.totalEmissions.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => handleSetBaseline(route.routeId)}
                      disabled={route.isBaseline}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${route.isBaseline
                          ? 'bg-navy-900 text-slate-500 cursor-not-allowed border border-navy-700'
                          : 'bg-ocean-600 hover:bg-ocean-500 text-white shadow-lg shadow-ocean-500/20 hover:shadow-ocean-500/40'
                        }`}
                    >
                      {route.isBaseline ? 'Current Baseline' : 'Set as Baseline'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

