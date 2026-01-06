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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">FuelEU Maritime Compliance Dashboard</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
