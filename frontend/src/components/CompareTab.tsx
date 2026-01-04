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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vessel Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Type
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
                  % Difference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliant
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparison.comparisons.map((comp) => (
                <tr key={comp.routeId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {comp.routeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.vesselType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.fuelType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comp.baselineIntensity.toFixed(2)} gCO₂e/MJ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comp.comparisonIntensity.toFixed(2)} gCO₂e/MJ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={
                        comp.percentDifference > 0
                          ? 'text-red-600 font-semibold'
                          : 'text-green-600 font-semibold'
                      }
                    >
                      {comp.percentDifference > 0 ? '+' : ''}
                      {comp.percentDifference.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {comp.compliant ? (
                      <span className="text-green-600 font-semibold">✅ Compliant</span>
                    ) : (
                      <span className="text-red-600 font-semibold">❌ Non-compliant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Intensity Comparison Chart</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500">Chart visualization would go here (bar/line chart)</p>
        </div>
      </div>
    </div>
  );
}

