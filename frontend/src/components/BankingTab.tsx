import { useState } from 'react';
import { apiClient } from '../adapters/infrastructure/apiClient';
import type { ComplianceBalanceDTO, BankingRecordsDTO, RouteDTO } from '../adapters/infrastructure/apiClient';

export default function BankingTab() {
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('2024');
  const [balance, setBalance] = useState<ComplianceBalanceDTO | null>(null);
  const [bankingRecords, setBankingRecords] = useState<BankingRecordsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Banking form state
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [lastOperation, setLastOperation] = useState<{
    type: 'bank' | 'apply';
    cbBefore: number;
    applied: number;
    cbAfter: number;
  } | null>(null);

  const loadData = async () => {
    if (!shipId || !year) {
      setError('Ship ID and Year are required');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setBalance(null);
    setBankingRecords(null);
    setLastOperation(null);

    try {
      // 1. Check Baseline Status FIRST
      const routes = await apiClient.getRoutes();
      const targetRoute = routes.find(r => r.routeId === shipId && r.year === parseInt(year));

      if (targetRoute && targetRoute.isBaseline) {
        setInfoMessage('Baseline ships are not eligible for compliance balance, banking, or pooling.');
        setLoading(false);
        return;
      }

      // 2. Fetch Compliance Balance (Only if not baseline)
      try {
        const cbData = await apiClient.getComplianceBalance(shipId, parseInt(year));
        setBalance(cbData);

        // 3. Fetch Banking Records
        setLoadingRecords(true);
        try {
          const recordsData = await apiClient.getBankingRecords(shipId, parseInt(year));
          setBankingRecords(recordsData);
        } catch (recordErr: any) {
          if (recordErr.status === 404) {
            setBankingRecords({ shipId, year: parseInt(year), records: [], totalBanked: 0 });
          } else {
            console.error('Failed to load banking records', recordErr);
          }
        } finally {
          setLoadingRecords(false);
        }

      } catch (cbErr: any) {
        const errorMsg = cbErr instanceof Error ? cbErr.message : 'Failed to load compliance balance';
        // Double check for baseline error just in case race condition
        if (errorMsg.toLowerCase().includes('baseline')) {
          setInfoMessage('Baseline ships are not eligible for compliance balance, banking, or pooling.');
        } else {
          setError(errorMsg);
        }
      }

    } catch (err) {
      setError('Failed to validate ship status');
    } finally {
      setLoading(false);
    }
  };


  const handleBank = async () => {
    if (!shipId || !year || !bankAmount) return;

    try {
      setLoading(true);
      setError(null);
      await apiClient.bankSurplus(shipId, parseInt(year), parseFloat(bankAmount));
      setBankAmount('');
      await loadData(); // Reload all data
      alert('Surplus banked successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bank surplus');
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!shipId || !year || !applyAmount) return;

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
      await loadData(); // Reload data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply banked surplus');
      setLoading(false);
    }
  };

  // Logic for Apply Button
  const canApply = !loading &&
    balance &&
    balance.isDeficit &&
    bankingRecords &&
    bankingRecords.totalBanked > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Banking & Compliance</h2>
        <span className="bg-ocean-900/50 border border-ocean-700 text-ocean-300 text-xs font-semibold px-2.5 py-0.5 rounded">Article 20</span>
      </div>

      {/* Search Section */}
      <div className="bg-navy-800/50 backdrop-blur border border-navy-700 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Select Ship</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Ship ID</label>
            <input
              type="text"
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg shadow-sm focus:ring-ocean-500 focus:border-ocean-500 text-white placeholder-navy-600"
              placeholder="e.g. SHIP001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg shadow-sm focus:ring-ocean-500 focus:border-ocean-500 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full bg-ocean-600 hover:bg-ocean-500 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-lg shadow-ocean-600/20 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? 'Loading...' : 'Load Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Info/Error Messages */}
      {infoMessage && (
        <div className="bg-ocean-900/30 border-l-4 border-ocean-500 p-4 rounded-r backdrop-blur-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-ocean-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-ocean-100">{infoMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r backdrop-blur-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Only if balance loaded) */}
      {balance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Status Card */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-navy-700 bg-navy-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-white">Compliance Status</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${balance.isCompliant ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {balance.isCompliant ? 'Compliant' : 'Non-Compliant'}
              </span>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-slate-400 block mb-1">Balance</span>
                <span className={`text-3xl font-bold ${balance.cb >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {balance.cb.toFixed(4)}
                </span>
                <span className="text-xs text-slate-500 block mt-1">t CO₂e</span>
              </div>
              <div className="flex flex-col justify-center">
                {balance.isSurplus && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 w-fit">🟢 Surplus</span>}
                {balance.isDeficit && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 w-fit">🔴 Deficit</span>}
                {balance.cb === 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-slate-700 text-slate-300 border border-slate-600 w-fit">⚪ Neutral</span>}
              </div>
            </div>
          </div>

          {/* Banking Records Summary */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-navy-700 bg-navy-800/50">
              <h3 className="font-semibold text-white">Banked Surplus</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Total Available</span>
                <span className="text-2xl font-bold text-ocean-400">
                  {bankingRecords?.totalBanked.toFixed(4) || '0.0000'}
                </span>
              </div>
              <div className="text-xs text-navy-500 rounded bg-navy-900/50 p-2 inline-block text-slate-400">
                {bankingRecords?.records.length || 0} record(s) found
              </div>
            </div>
          </div>

          {/* Actions: Bank Surplus */}
          <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 shadow-lg">
            <h4 className="font-medium text-white mb-4">Bank Surplus</h4>
            <div className="space-y-4">
              <input
                type="number"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                placeholder="Amount to bank (t CO₂e)"
                disabled={!balance.isSurplus}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-white placeholder-navy-600 disabled:bg-navy-950 disabled:text-navy-700"
              />
              <button
                onClick={handleBank}
                disabled={!balance.isSurplus || !bankAmount || parseFloat(bankAmount) <= 0}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-green-600/20 disabled:bg-navy-700 disabled:text-navy-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Bank Surplus
              </button>
              {!balance.isSurplus && <p className="text-xs text-slate-500 text-center">Only surplus can be banked.</p>}
            </div>
          </div>

          {/* Actions: Apply Banked */}
          <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 shadow-lg">
            <h4 className="font-medium text-white mb-4">Apply Banked Surplus</h4>
            <div className="space-y-4">
              <input
                type="number"
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder="Amount to apply (t CO₂e)"
                disabled={!canApply}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg shadow-sm focus:ring-ocean-500 focus:border-ocean-500 text-white placeholder-navy-600 disabled:bg-navy-950 disabled:text-navy-700"
              />
              <button
                onClick={handleApply}
                disabled={!canApply || !applyAmount || parseFloat(applyAmount) <= 0}
                className="w-full bg-ocean-600 hover:bg-ocean-500 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-ocean-600/20 disabled:bg-navy-700 disabled:text-navy-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Apply to Deficit
              </button>
              {!balance.isDeficit && <p className="text-xs text-slate-500 text-center">Only deficits can accept banked surplus.</p>}
              {balance.isDeficit && (!bankingRecords || bankingRecords.totalBanked <= 0) && <p className="text-xs text-red-400 text-center">No banked surplus available.</p>}
            </div>
          </div>

        </div>
      )}

      {/* Operation Receipt */}
      {lastOperation && (
        <div className="bg-navy-900 text-white rounded-xl p-6 shadow-xl border border-ocean-900/50 mt-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <h4 className="text-lg font-medium mb-4 flex items-center relative z-10">
            <span className="bg-green-500 w-2 h-2 rounded-full mr-2 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            Transaction Successful
          </h4>
          <div className="grid grid-cols-3 gap-8 text-center relative z-10">
            <div className="p-4 bg-navy-950/50 rounded-lg">
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Before</div>
              <div className="text-xl font-mono text-slate-200">{lastOperation.cbBefore.toFixed(4)}</div>
            </div>
            <div className="p-4 bg-navy-950/50 rounded-lg border border-green-500/20">
              <div className="text-green-500/70 text-xs uppercase tracking-wider mb-1">Applied</div>
              <div className="text-xl font-mono text-green-400">+{lastOperation.applied.toFixed(4)}</div>
            </div>
            <div className="p-4 bg-navy-950/50 rounded-lg">
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">After</div>
              <div className="text-xl font-mono text-white">{lastOperation.cbAfter.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

