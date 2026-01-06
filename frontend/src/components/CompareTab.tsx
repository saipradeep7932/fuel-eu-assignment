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

  if (loading) {
    return <div className="text-center py-8">Loading comparison...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">Error: {error}</div>;
  }

  if (!comparison) {
    return <div className="text-center py-8">No comparison data available</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Route Comparison</h2>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Year:</label>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="Year (optional)"
            className="border border-gray-300 rounded-md px-3 py-2 w-32"
          />
          <button
            onClick={loadComparison}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Baseline Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Baseline Route</h3>
        <p className="text-sm text-blue-800">
          <strong>Route ID:</strong> {comparison.baseline.routeId} |{' '}
          <strong>Year:</strong> {comparison.baseline.year} |{' '}
          <strong>Vessel Type:</strong> {comparison.baseline.vesselType} |{' '}
          <strong>Intensity:</strong> {comparison.baseline.intensity.toFixed(2)} gCO₂e/MJ
        </p>
        <p className="text-sm text-blue-800 mt-1">
          <strong>Target Intensity:</strong> {comparison.targetIntensity.toFixed(4)} gCO₂e/MJ
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        {comparison.comparisons.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg">No comparison data available.</p>
            <p className="text-sm mt-2">Try adjusting the year filter or ensure routes exist for the baseline year.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel / Fuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Baseline Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comparison Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparison.comparisons.map((comp) => {
                  const isImprovement = comp.comparisonIntensity < comp.baselineIntensity;
                  return (
                    <tr key={comp.routeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comp.routeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comp.vesselType} / {comp.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comp.baselineIntensity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comp.comparisonIntensity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-lg ${comp.percentDifference > 0
                                ? 'text-red-500' // Higher intensity (Worse)
                                : 'text-green-500' // Lower intensity (Better)
                              }`}
                          >
                            {comp.percentDifference > 0 ? '↑' : '↓'}
                          </span>
                          <span className="text-gray-600">
                            {Math.abs(comp.percentDifference).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {comp.compliant ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ❌ Non-compliant
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bar Chart Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-6">Intensity Comparison (gCO₂e/MJ)</h3>
        {comparison.comparisons.length > 0 ? (
          <div className="space-y-6">
            {comparison.comparisons.map((comp) => {
              const maxVal = Math.max(comp.baselineIntensity, comp.comparisonIntensity) * 1.2;
              const baselineWidth = (comp.baselineIntensity / maxVal) * 100;
              const comparisonWidth = (comp.comparisonIntensity / maxVal) * 100;

              return (
                <div key={comp.routeId} className="border-b pb-4 last:border-0">
                  <p className="text-sm font-medium mb-2">{comp.routeId} ({comp.year})</p>

                  {/* Baseline Bar */}
                  <div className="flex items-center mb-1">
                    <span className="w-24 text-xs text-gray-500">Baseline</span>
                    <div className="flex-1 max-w-md h-4 bg-gray-100 rounded-r overflow-hidden relative">
                      <div
                        className="h-full bg-blue-400"
                        style={{ width: `${baselineWidth}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs font-medium">{comp.baselineIntensity.toFixed(1)}</span>
                  </div>

                  {/* Comparison Bar */}
                  <div className="flex items-center">
                    <span className="w-24 text-xs text-gray-500">Actual</span>
                    <div className="flex-1 max-w-md h-4 bg-gray-100 rounded-r overflow-hidden relative">
                      <div
                        className={`h-full ${comp.comparisonIntensity > comp.baselineIntensity ? 'bg-red-400' : 'bg-green-400'}`}
                        style={{ width: `${comparisonWidth}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs font-medium">{comp.comparisonIntensity.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">Select criteria to see visualization</div>
        )}
      </div>
    </div>
  );
}

