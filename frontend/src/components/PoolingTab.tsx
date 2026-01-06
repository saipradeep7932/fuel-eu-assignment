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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Pooling & Compliance</h2>
        <span className="bg-purple-900/50 border border-purple-700 text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded">Article 21</span>
      </div>

      {/* Pool Configuration */}
      <div className="bg-navy-800/50 backdrop-blur border border-navy-700 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Create Pool</h3>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setMembers(members.map(m => ({ ...m, cbBefore: null, error: undefined })));
            }}
            className="w-full md:w-48 bg-navy-900 border border-navy-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white"
          />
        </div>

        {/* Pool Members */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-slate-300">Pool Members</h4>
            <button
              onClick={addMember}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm font-medium transition-colors border border-navy-600"
            >
              + Add Ship
            </button>
          </div>

          <div className="bg-navy-900/50 rounded-lg p-4 space-y-4 border border-navy-800">
            {members.map((member, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Ship ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={member.shipId}
                      onChange={(e) => updateMemberShipId(index, e.target.value)}
                      onBlur={() => { if (member.shipId && !member.cbBefore) fetchMemberCb(index) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') fetchMemberCb(index) }}
                      placeholder="e.g. SHIP001"
                      className={`w-full bg-navy-950 border rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-navy-700 ${member.error ? 'border-red-900/50 bg-red-900/10' : 'border-navy-700'}`}
                    />
                    <button
                      onClick={() => fetchMemberCb(index)}
                      className="px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
                      title="Fetch Compliance Balance"
                    >
                      🔍
                    </button>
                  </div>
                  {member.error && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{member.error}</p>
                  )}
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Adjusted CB (t CO₂e)</label>
                  <div className={`w-full border rounded-lg px-3 py-2 h-[42px] flex items-center ${member.cbBefore === null ? 'bg-navy-950 text-slate-600 italic border-navy-800' :
                      (member.cbBefore >= 0 ? 'bg-green-500/10 text-green-400 font-medium border-green-500/20' : 'bg-red-500/10 text-red-400 font-medium border-red-500/20')
                    }`}>
                    {member.cbBefore !== null ? member.cbBefore.toFixed(4) : 'Not fetched'}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-end h-full pt-6">
                  {members.length > 1 && (
                    <button
                      onClick={() => removeMember(index)}
                      className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg w-full text-center transition-colors"
                      title="Remove Member"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pool Sum Indicator */}
        <div className={`p-4 rounded-xl border ${isValid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} transition-all`}>
          <div className="flex justify-between items-center">
            <div>
              <span className={`text-sm font-semibold uppercase tracking-wider ${isValid ? 'text-green-400' : 'text-red-400'}`}>Projected Pool Sum</span>
              <p className={`text-xs mt-1 ${isValid ? 'text-green-500/70' : 'text-red-500/70'}`}>
                {allMembersHaveCb
                  ? (isValid ? 'Pool is valid (Sum ≥ 0)' : 'Pool is invalid (Sum < 0)')
                  : 'Waiting for ship data...'}
              </p>
            </div>
            <span className={`text-3xl font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
              {poolSum.toFixed(4)} <span className="text-base font-normal opacity-70">t CO₂e</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleCreatePool}
          disabled={loading || !isValid || !allMembersHaveCb || members.length === 0}
          className="mt-6 w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-500 disabled:bg-navy-800 disabled:text-navy-600 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 disabled:shadow-none transition-all"
        >
          {loading ? 'Validating & Creating Pool...' : 'Create Pool'}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-900/20 text-red-300 rounded-xl border border-red-900/50 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Pool Result */}
      {poolResult && (
        <div className="bg-navy-800/50 backdrop-blur p-6 rounded-xl shadow-lg border border-navy-700 mt-8">
          <div className="flex items-center justify-between mb-6 border-b border-navy-700 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Pool Formation Result</h3>
              <p className="text-sm text-slate-400">Allocation simulated successfully</p>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${poolResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                {poolResult.valid ? '✅ Pool Valid' : '❌ Pool Invalid'}
              </div>
              <div className="text-xs text-slate-500">Total Sum: {poolResult.poolSum.toFixed(4)}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-navy-700">
            <table className="min-w-full divide-y divide-navy-700">
              <thead className="bg-navy-900/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Ship ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">CB Before</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocation</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">CB After</th>
                </tr>
              </thead>
              <tbody className="bg-navy-800 divide-y divide-navy-700">
                {poolResult.members.map((member, index) => {
                  const change = member.cbAfter - member.cbBefore;
                  // Determine Role
                  let role = 'Neutral';
                  let roleBadge = 'bg-navy-700 text-slate-300';

                  if (member.cbBefore > 0 && change < 0) {
                    role = 'Donor (Surplus)';
                    roleBadge = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
                  } else if (member.cbBefore < 0 && change > 0) {
                    role = 'Receiver (Deficit)';
                    roleBadge = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
                  } else if (member.cbBefore > 0) {
                    role = 'Surplus (Unused)';
                    roleBadge = 'bg-green-500/20 text-green-300 border border-green-500/30';
                  } else if (member.cbBefore < 0) {
                    role = 'Deficit (Covered)';
                    if (poolResult.valid) roleBadge = 'bg-green-500/10 text-green-400 border border-green-500/20';
                  }

                  return (
                    <tr key={index} className="hover:bg-navy-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{member.shipId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge}`}>
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 text-right font-mono">
                        {member.cbBefore.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                        <span className={`font-medium ${change > 0 ? 'text-green-400' : change < 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                          {change > 0 ? '+' : ''}{change !== 0 ? change.toFixed(4) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono">
                        {member.cbAfter.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

