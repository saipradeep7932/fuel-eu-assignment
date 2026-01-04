import { useState } from 'react';
import { apiClient } from '../adapters/infrastructure/apiClient';

interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export default function PoolingTab() {
  const [year, setYear] = useState('2024');
  const [members, setMembers] = useState<Array<{ shipId: string; cbBefore: number }>>([
    { shipId: '', cbBefore: 0 },
  ]);
  const [poolResult, setPoolResult] = useState<{
    poolSum: number;
    valid: boolean;
    members: PoolMember[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    setMembers([...members, { shipId: '', cbBefore: 0 }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: 'shipId' | 'cbBefore', value: string | number) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const calculatePoolSum = () => {
    return members.reduce((sum, m) => sum + (m.cbBefore || 0), 0);
  };

  const handleCreatePool = async () => {
    if (!year || members.length === 0) {
      setError('Year and at least one member required');
      return;
    }

    const invalidMembers = members.filter((m) => !m.shipId || m.cbBefore === undefined);
    if (invalidMembers.length > 0) {
      setError('All members must have Ship ID and CB Before value');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createPool(parseInt(year), members);
      setPoolResult({
        poolSum: result.poolSum,
        valid: result.valid,
        members: result.members,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pool');
      setPoolResult(null);
    } finally {
      setLoading(false);
    }
  };

  const poolSum = calculatePoolSum();
  const isValid = poolSum >= 0;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pooling (Article 21)</h2>

      {/* Pool Configuration */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Create Pool</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        {/* Pool Members */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Pool Members</h4>
            <button
              onClick={addMember}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              + Add Member
            </button>
          </div>

          {members.map((member, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ship ID</label>
                <input
                  type="text"
                  value={member.shipId}
                  onChange={(e) => updateMember(index, 'shipId', e.target.value)}
                  placeholder="e.g., SHIP001"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CB Before (t CO₂e)</label>
                <input
                  type="number"
                  value={member.cbBefore || ''}
                  onChange={(e) => updateMember(index, 'cbBefore', parseFloat(e.target.value) || 0)}
                  placeholder="0.0000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pool Sum Indicator */}
        <div className="mt-6 p-4 rounded-lg border-2" style={{ borderColor: isValid ? '#10b981' : '#ef4444', backgroundColor: isValid ? '#f0fdf4' : '#fef2f2' }}>
          <div className="flex justify-between items-center">
            <span className="font-medium">Pool Sum:</span>
            <span className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
              {poolSum.toFixed(4)} t CO₂e
            </span>
          </div>
          <p className={`text-sm mt-1 ${isValid ? 'text-green-700' : 'text-red-700'}`}>
            {isValid ? '✅ Valid (Sum ≥ 0)' : '❌ Invalid (Sum < 0). Pool must have sum ≥ 0'}
          </p>
        </div>

        <button
          onClick={handleCreatePool}
          disabled={loading || !isValid || members.length === 0}
          className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating Pool...' : 'Create Pool'}
        </button>
      </div>

      {/* Pool Result */}
      {poolResult && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Pool Result</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600">Pool Sum: <strong>{poolResult.poolSum.toFixed(4)} t CO₂e</strong></p>
            <p className="text-sm text-gray-600">Valid: <strong>{poolResult.valid ? 'Yes' : 'No'}</strong></p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ship ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB Before</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB After</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {poolResult.members.map((member, index) => {
                  const change = member.cbAfter - member.cbBefore;
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{member.shipId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.cbBefore.toFixed(4)} t CO₂e
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.cbAfter.toFixed(4)} t CO₂e
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {change >= 0 ? '+' : ''}{change.toFixed(4)} t CO₂e
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

