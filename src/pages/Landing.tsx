
import { Button } from '../components/ui/button';
import { Wallet, TrendingUp, Users, Shield } from 'lucide-react';

export const Landing = () => {
  const handleGoogleLogin = () => {
    // This would integrate with your authentication provider
    // For now, we'll simulate login and redirect to dashboard
    console.log('Google login clicked');
    // Simulate successful login
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
    }));
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">BuddyCash</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Track Money with Friends,
            <span className="text-blue-600 block">Simply & Securely</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Keep track of money you lend and borrow with friends, family, and colleagues. 
            Split expenses, settle debts, and maintain healthy financial relationships.
          </p>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get Started</h2>
            <Button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-lg font-medium flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Expenses</h3>
              <p className="text-gray-600">Record money given and received with detailed transaction history</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Contacts</h3>
              <p className="text-gray-600">Keep track of balances with friends, family, and colleagues</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your financial data is encrypted and completely private</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
