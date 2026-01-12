'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, AlertCircle, Wallet, CheckCircle } from 'lucide-react';
import { getAuthService, UserRole } from '../../lib/services/authService';
import { getMetaMaskService } from '../../lib/services/metamaskService';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const authService = getAuthService();
  const metamaskService = getMetaMaskService();

  useEffect(() => {
    checkMetaMaskConnection();
  }, [username]);

  const checkMetaMaskConnection = async () => {
    if (username === 'admin') {
      const connected = await metamaskService.isConnected();
      if (connected) {
        const account = await metamaskService.getCurrentAccount();
        if (account) {
          setWalletAddress(account);
          setIsMetaMaskConnected(true);
        }
      }
    } else {
      setIsMetaMaskConnected(false);
      setWalletAddress('');
    }
  };

  const connectMetaMask = async () => {
    setIsConnectingWallet(true);
    setError('');

    try {
      const accounts = await metamaskService.connect();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0].address);
        setIsMetaMaskConnected(true);
        
        // Check network
        const chainId = await metamaskService.getChainId();
        if (chainId !== '0x1fb7') {
          await metamaskService.switchToShardeum();
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // For admin, require MetaMask connection
      if (username === 'admin' && !isMetaMaskConnected) {
        throw new Error('Admin requires MetaMask wallet connection');
      }

      const loginData = {
        username,
        password,
        ...(username === 'admin' && { walletAddress })
      };

      const response = await authService.login(loginData);
      onLogin(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { username: 'admin', role: 'Admin', description: 'Full access + MetaMask' },
    { username: 'producer', role: 'Producer', description: 'Set prices, manage supply' },
    { username: 'retailer', role: 'Retailer', description: 'Create batches, update stages' },
    { username: 'transporter', role: 'Transporter', description: 'Update transport stages' },
    { username: 'consumer', role: 'Consumer', description: 'QR scan only' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">FreshChain Login</h2>
          <p className="mt-2 text-gray-600">Choose your role to continue</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* MetaMask Connection for Admin */}
            {username === 'admin' && (
              <div className="space-y-3">
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MetaMask Wallet (Required for Admin)
                  </label>
                  
                  {!isMetaMaskConnected ? (
                    <button
                      type="button"
                      onClick={connectMetaMask}
                      disabled={isConnectingWallet}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>{isConnectingWallet ? 'Connecting...' : 'Connect MetaMask'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">Wallet Connected</span>
                        <p className="text-xs text-green-600 font-mono">{walletAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (username === 'admin' && !isMetaMaskConnected)}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'Logging in...' : 'Login'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Users:</h3>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setUsername(user.username);
                    setPassword(user.username + '123');
                  }}
                >
                  <div>
                    <span className="font-medium text-sm">{user.username}</span>
                    <span className="text-xs text-gray-500 ml-2">({user.role})</span>
                  </div>
                  <span className="text-xs text-gray-400">{user.description}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Password format: <code>[username]123</code> (e.g., admin123, retailer123)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;