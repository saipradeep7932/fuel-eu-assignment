import { useState } from 'react';
import RoutesTab from './components/RoutesTab';
import CompareTab from './components/CompareTab';
import BankingTab from './components/BankingTab';
import PoolingTab from './components/PoolingTab';

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  const tabs = [
    { id: 'routes' as Tab, label: 'Routes' },
    { id: 'compare' as Tab, label: 'Compare' },
    { id: 'banking' as Tab, label: 'Banking' },
    { id: 'pooling' as Tab, label: 'Pooling' },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 selection:bg-ocean-500/30">
      {/* Header */}
      <header className="bg-navy-900/80 backdrop-blur-md border-b border-navy-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-ocean-600 p-2 rounded-lg shadow-lg shadow-ocean-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-ocean-400">
              FuelEU Maritime
            </h1>
          </div>
          <div className="hidden md:block">
            <span className="px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-xs font-medium text-slate-400">
              Compliance Dashboard
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-navy-900/50 border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-all ${activeTab === tab.id
                  ? 'border-ocean-500 text-ocean-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-navy-600'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div style={{ display: activeTab === 'routes' ? 'block' : 'none' }}>
          <RoutesTab />
        </div>
        <div style={{ display: activeTab === 'compare' ? 'block' : 'none' }}>
          <CompareTab />
        </div>
        <div style={{ display: activeTab === 'banking' ? 'block' : 'none' }}>
          <BankingTab />
        </div>
        <div style={{ display: activeTab === 'pooling' ? 'block' : 'none' }}>
          <PoolingTab />
        </div>
      </main>
    </div>
  );
}

export default App;
