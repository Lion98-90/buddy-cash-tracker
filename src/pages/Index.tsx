
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { Transactions } from '../components/Transactions';
import { People } from '../components/People';
import { Reports } from '../components/Reports';
import { Profile } from '../components/Profile';
import { Settings } from '../components/Settings';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Redirect to landing if not authenticated
    if (!isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'people':
        return <People />;
      case 'reports':
        return <Reports />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
