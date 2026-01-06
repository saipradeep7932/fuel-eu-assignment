import { useState, useEffect } from 'react';
import { apiClient, type ComparisonResult } from '../adapters/infrastructure/apiClient';

export default function CompareTab() {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('');

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const year = yearFilter ? parseInt(yearFilter) : undefined;
      const data = await apiClient.getComparison(year);
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-slate-400">Loading comparisons...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Compare Routes</h2>
        <span className="text-sm text-slate-400">Analyze performance against baseline</span>
      </div>

      {/* Filter */}
      <div className="bg-navy-800/50 backdrop-blur p-4 rounded-xl border border-navy-700 shadow-lg">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">Filter by Year:</label>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="Year (optional)"
            className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 w-32 text-white placeholder-navy-500 focus:ring-ocean-500 focus:border-ocean-500"
          />
          <button
            onClick={loadComparison}
            className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-500 transition-all shadow-lg shadow-ocean-600/20"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {!comparison ? (
        <div className="text-center py-12 bg-navy-800/30 rounded-xl border border-navy-800 border-dashed">
          <p className="text-slate-500">No comparison data available.</p>
        </div>
      ) : (
        <>
          {/* Baseline Summary Card */}
          <div className="bg-gradient-to-br from-navy-800 to-navy-900 border border-navy-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <h3 className="text-sm font-semibold text-ocean-400 uppercase tracking-wider mb-4">Baseline Comparison Target</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Route ID</span>
                <span className="text-lg font-medium text-white">{comparison.baseline.routeId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Year</span>
                <span className="text-lg font-medium text-white">{comparison.baseline.year}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Target Intensity</span>
                <span className="text-2xl font-bold text-white">
                  {comparison.targetIntensity.toFixed(1)} <span className="text-xs font-normal text-slate-500">gCO₂e/MJ</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Baseline Intensity</span>
                <span className="text-xl font-bold text-slate-300">
                  {comparison.baseline.intensity.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Comparisons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparison.comparisons.map((comp) => {
              const isImprovement = comp.percentDifference < 0;
              return (
                <div key={comp.routeId} className="bg-navy-800/50 border border-navy-700 rounded-xl p-5 hover:bg-navy-800 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-ocean-300 transition-colors">{comp.routeId}</h4>
                      <div className="flex gap-2 text-xs mt-1">
                        <span className="text-slate-400">{comp.vesselType}</span>
                        <span className="text-navy-600">•</span>
                        <span className="text-slate-400">{comp.fuelType}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${comp.compliant ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {comp.compliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Interactive Bar Chart Mini */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Intensity Comparison</span>
                      </div>
                      <div className="h-2 bg-navy-950 rounded-full overflow-hidden flex">
                        {/* Example simplified visual */}
                        <div className="h-full bg-slate-600 w-1/2 opacity-30"></div>
                        <div
                          className={`h-full ${isImprovement ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (comp.comparisonIntensity / (comp.baselineIntensity * 1.5)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-2">
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Current Intensity</div>
                        <div className="text-lg font-bold text-white">{comp.comparisonIntensity.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-0.5">Difference</div>
                        <div className={`text-lg font-bold ${isImprovement ? 'text-green-400' : 'text-red-400'}`}>
                          {isImprovement ? '↓' : '↑'} {Math.abs(comp.percentDifference).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  );
}

