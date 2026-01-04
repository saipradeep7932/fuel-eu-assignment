import { useState } from 'react';
import { apiClient, ComplianceBalanceDTO } from '../adapters/infrastructure/apiClient';

export default function BankingTab() {
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('2024');
  const [balance, setBalance] = useState<ComplianceBalanceDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Banking form state
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [lastOperation, setLastOperation] = useState<{
    type: 'bank' | 'apply';
    cbBefore: number;
    applied: number;
    cbAfter: number;
  } | null>(null);

  const loadComplianceBalance = async () => {
    if (!shipId || !year) {
      setError('Ship ID and Year are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getComplianceBalance(shipId, parseInt(year));
      setBalance(data);
      setLastOperation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance balance');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBank = async () => {
    if (!shipId || !year || !bankAmount) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.bankSurplus(shipId, parseInt(year), parseFloat(bankAmount));
      setBankAmount('');
      await loadComplianceBalance();
      alert('Surplus banked successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bank surplus');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!shipId || !year || !applyAmount || !balance) {
      setError('All fields are required and balance must be loaded');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.applyBanked(shipId, parseInt(year), parseFloat(applyAmount));
      setLastOperation({
        type: 'apply',
        cbBefore: result.cbBefore,
        applied: result.applied,
        cbAfter: result.cbAfter,
      });
      setApplyAmount('');
      await loadComplianceBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply banked surplus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Banking (Article 20)</h2>

      {/* Load CB Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Get Compliance Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ship ID</label>
            <input
              type="text"
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              placeholder="e.g., SHIP001"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadComplianceBalance}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Load CB
            </button>
          </div>
        </div>
      </div>

      {/* Current CB Display */}
      {balance && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium mb-4">Current Compliance Balance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">CB Value</p>
              <p className={`text-2xl font-bold ${balance.cb >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.cb.toFixed(4)} t CO₂e
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold">
                {balance.isSurplus && '🟢 Surplus'}
                {balance.isDeficit && '🔴 Deficit'}
                {balance.cb === 0 && '⚪ Neutral'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Compliant</p>
              <p className="text-lg font-semibold">
                {balance.isCompliant ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ship ID</p>
              <p className="text-lg font-semibold">{balance.shipId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Banking Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Surplus */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Bank Surplus</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (t CO₂e)</label>
              <input
                type="number"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                placeholder="Positive amount"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!balance || balance.cb <= 0}
              />
            </div>
            <button
              onClick={handleBank}
              disabled={loading || !balance || balance.cb <= 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Bank Surplus
            </button>
            {balance && balance.cb <= 0 && (
              <p className="text-sm text-gray-500">Only positive CB (surplus) can be banked</p>
            )}
          </div>
        </div>

        {/* Apply Banked */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Apply Banked Surplus</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (t CO₂e)</label>
              <input
                type="number"
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder="Amount to apply"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!balance || balance.cb >= 0}
              />
            </div>
            <button
              onClick={handleApply}
              disabled={loading || !balance || balance.cb >= 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Apply to Deficit
            </button>
            {balance && balance.cb >= 0 && (
              <p className="text-sm text-gray-500">Only deficits can have banked amounts applied</p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs (if operation performed) */}
      {lastOperation && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Operation Result</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">CB Before</p>
              <p className="text-xl font-bold">{lastOperation.cbBefore.toFixed(4)} t CO₂e</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Applied</p>
              <p className="text-xl font-bold text-blue-600">{lastOperation.applied.toFixed(4)} t CO₂e</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CB After</p>
              <p className="text-xl font-bold text-green-600">{lastOperation.cbAfter.toFixed(4)} t CO₂e</p>
            </div>
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

