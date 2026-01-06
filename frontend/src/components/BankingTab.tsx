import { useState } from 'react';
import { apiClient } from '../adapters/infrastructure/apiClient';
import type { ComplianceBalanceDTO, BankingRecordsDTO } from '../adapters/infrastructure/apiClient';

export default function BankingTab() {
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('2024');
  const [balance, setBalance] = useState<ComplianceBalanceDTO | null>(null);
  const [bankingRecords, setBankingRecords] = useState<BankingRecordsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
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
      // Also load banking records when CB is loaded
      await loadBankingRecords();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load compliance balance';

      if (errorMsg.toLowerCase().includes('baseline')) {
        setError('Baseline ships are not eligible for banking operations (No Compliance Balance).');
      } else {
        setError(errorMsg);
      }

      setBalance(null);
      setBankingRecords(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBankingRecords = async () => {
    if (!shipId || !year) {
      return;
    }

    try {
      setLoadingRecords(true);
      const data = await apiClient.getBankingRecords(shipId, parseInt(year));
      setBankingRecords(data);
    } catch (err) {
      // Treat 404 as valid empty state (no records exist yet)
      if (err instanceof Error && (err as any).status === 404) {
        setBankingRecords({ shipId, year: parseInt(year), records: [], totalBanked: 0 });
      } else {
        // Only show error toast for actual errors (400, 500, etc.)
        console.error('Failed to load banking records:', err);
        setBankingRecords(null);
      }
    } finally {
      setLoadingRecords(false);
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
      await loadBankingRecords(); // Reload records after banking
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
      await loadBankingRecords(); // Reload records after applying
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
        <div className="bg-white p-6 rounded-lg shadow relative">
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

            <div className="relative group">
              <button
                onClick={handleApply}
                disabled={loading || !balance || !balance.isDeficit || !bankingRecords || bankingRecords.totalBanked <= 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply to Deficit
              </button>
              {/* Tooltip for disabled state */}
              {balance && !balance.isDeficit && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  No deficit to offset
                </div>
              )}
              {balance && balance.isDeficit && bankingRecords && bankingRecords.totalBanked <= 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  No banked surplus available
                </div>
              )}
            </div>

            {balance && balance.cb >= 0 && (
              <p className="text-sm text-gray-500">Only deficits can have banked amounts applied</p>
            )}

            {/* Inline Error for Apply */}
            {error && error.toLowerCase().includes('apply') && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 mt-2">
                {error}
              </div>
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

      {/* Banking Records */}
      {balance && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Banking Records</h3>
            {loadingRecords && <span className="text-sm text-gray-500">Loading...</span>}
          </div>

          {bankingRecords && bankingRecords.records.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Banked</p>
                <p className="text-2xl font-bold text-green-600">
                  {bankingRecords.totalBanked.toFixed(4)} t CO₂e
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount (t CO₂e)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankingRecords.records.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.amount.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            !loadingRecords && (
              <p className="text-sm text-gray-500 text-center py-4">
                No banking records found for this ship and year.
              </p>
            )
          )}
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

