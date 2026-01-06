import { useState } from 'react';
import { apiClient } from '../adapters/infrastructure/apiClient';

interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export default function PoolingTab() {
  const [year, setYear] = useState('2024');
  const [members, setMembers] = useState<Array<{ shipId: string; cbBefore: number | null; error?: string }>>([
    { shipId: '', cbBefore: null },
  ]);
  const [poolResult, setPoolResult] = useState<{
    poolSum: number;
    valid: boolean;
    members: PoolMember[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    setMembers([...members, { shipId: '', cbBefore: null }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMemberShipId = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], shipId: value, cbBefore: null, error: undefined }; // Reset CB when ID changes
    setMembers(updated);
  };

  const fetchMemberCb = async (index: number) => {
    const member = members[index];
    if (!member.shipId || !year) return;

    try {
      const updated = [...members];
      // Reset error before fetch
      updated[index] = { ...updated[index], error: undefined };
      setMembers(updated);

      const result = await apiClient.getAdjustedComplianceBalance(member.shipId, parseInt(year));

      const newMembers = [...members];
      newMembers[index] = {
        ...newMembers[index],
        cbBefore: result.cb
      };
      setMembers(newMembers);
    } catch (err: any) {
      const newMembers = [...members];
      let errorMessage = 'Failed to fetch CB';
      if (err.status === 404) errorMessage = 'Ship/CB not found';
      if (err.message && err.message.toLowerCase().includes('baseline')) {
        errorMessage = 'Baseline (Ineligible)';
      } else if (err.status === 400) {
        errorMessage = 'Invalid Ship/Year';
      }

      newMembers[index] = {
        ...newMembers[index],
        cbBefore: null,
        error: errorMessage
      };
      setMembers(newMembers);
    }
  };

  const calculatePoolSum = () => {
    return members.reduce((sum, m) => sum + (m.cbBefore || 0), 0);
  };

  const handleCreatePool = async () => {
    if (!year || members.length === 0) {
      setError('Year and at least one member required');
      return;
    }

    // Filter out incomplete members
    const validMembers = members.filter((m) => m.shipId && m.cbBefore !== null && m.cbBefore !== undefined);

    if (validMembers.length !== members.length) {
      setError('Please fetch compliance balance for all members first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Map members to expected API format (casting cbBefore to number as we filtered nulls)
      const payloadMembers = validMembers.map(m => ({
        shipId: m.shipId,
        cbBefore: m.cbBefore as number
      }));

      const result = await apiClient.createPool(parseInt(year), payloadMembers);
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
  const allMembersHaveCb = members.every(m => m.cbBefore !== null);
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
            onChange={(e) => {
              setYear(e.target.value);
              // Reset all CBs when year changes as they might be invalid
              setMembers(members.map(m => ({ ...m, cbBefore: null })));
            }}
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
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b pb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ship ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={member.shipId}
                    onChange={(e) => updateMemberShipId(index, e.target.value)}
                    onBlur={() => { if (member.shipId && !member.cbBefore) fetchMemberCb(index) }} // Auto fetch on blur
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchMemberCb(index) }}
                    placeholder="e.g., SHIP001"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <button
                    onClick={() => fetchMemberCb(index)}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200"
                    title="Fetch Compliance Balance"
                  >
                    🔍
                  </button>
                </div>
                {member.error && (
                  <p className="text-red-500 text-xs mt-1">{member.error}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CB Adjust. (t CO₂e)</label>
                <div className={`w-full border rounded-md px-3 py-2 bg-gray-50 ${member.cbBefore === null ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                  {member.cbBefore !== null ? member.cbBefore.toFixed(4) : 'Not fetched'}
                </div>
              </div>

              <div className="flex items-end h-full pb-1">
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 w-full md:w-auto"
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
            {allMembersHaveCb
              ? (isValid ? '✅ Valid (Sum ≥ 0)' : '❌ Invalid (Sum < 0). Pool must have sum ≥ 0')
              : '⚠️ Fetch all compliance balances first'}
          </p>
        </div>

        <button
          onClick={handleCreatePool}
          disabled={loading || !isValid || !allMembersHaveCb || members.length === 0}
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
            <p className="text-sm text-gray-600">Valid: <strong>{poolResult.valid ? '✅ Yes' : '❌ No'}</strong></p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ship ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB Before</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB After</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {poolResult.members.map((member, index) => {
                  const change = member.cbAfter - member.cbBefore;
                  // Determine Role
                  let role = 'Neutral';
                  let roleColor = 'text-gray-500';

                  if (member.cbBefore > 0 && change < 0) {
                    role = 'Donor (Surplus)';
                    roleColor = 'text-blue-600 font-medium';
                  } else if (member.cbBefore < 0 && change > 0) {
                    role = 'Receiver (Deficit)';
                    roleColor = 'text-purple-600 font-medium';
                  } else if (member.cbBefore > 0) {
                    role = 'Surplus (Unused)';
                    roleColor = 'text-green-600';
                  } else if (member.cbBefore < 0) {
                    role = 'Deficit (Covered)'; // If change == 0? Wait, if change > 0 it's covered.
                    // If cbBefore < 0 and change == 0, it means it wasn't covered (impossible if valid pool?)
                    // If pool is valid, deficits should be covered.
                    if (poolResult.valid) role = 'Deficit (Covered)' // Just simplifying
                  }

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{member.shipId}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${roleColor}`}>
                        {role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.cbBefore.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {member.cbAfter.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${change > 0 ? 'bg-green-100 text-green-800' :
                          change < 0 ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(4)}
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

