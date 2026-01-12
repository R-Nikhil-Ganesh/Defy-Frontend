import { NextPage } from 'next';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { 
  Package, 
  Eye, 
  Shield, 
  Zap, 
  Camera, 
  LogOut, 
  User, 
  Settings, 
  Truck, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MapPin,
  Plus,
  RefreshCw,
  ExternalLink,
  QrCode,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { getAuthService, UserRole } from '../lib/services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminWallet from '../components/admin/AdminWallet';
import { getBackendService, BatchDetails } from '../lib/services/backendService';

const DashboardPage: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<BatchDetails[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const router = useRouter();
  const authService = getAuthService();
  const backendService = getBackendService();
  const user = authService.getUser();

  useEffect(() => {
    let mounted = true;
    
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsLoading(false);
      if (mounted) {
        loadDashboardData();
      }
    }
    
    return () => { mounted = false; };
  }, []);  // Empty dependency array - only run once on mount

  // Helper functions - MUST be defined before loadDashboardData
  const getStageProgress = (stage: string) => {
    switch (stage) {
      case 'Created': return 20;
      case 'Harvested': return 40;
      case 'In Transit': return 60;
      case 'At Retailer': return 80;
      case 'Selling': return 100;
      default: return 0;
    }
  };

  const getDisplayStage = (stage: string, userRole: string | undefined) => {
    // For transporters, show "Reached Retailer" instead of "At Retailer"
    if (userRole === 'transporter' && stage === 'At Retailer') {
      return 'Reached Retailer';
    }
    return stage;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Created': return 'text-gray-600';
      case 'Harvested': return 'text-green-600';
      case 'In Transit': return 'text-blue-600';
      case 'At Retailer': return 'text-purple-600';
      case 'Selling': return 'text-emerald-600';
      default: return 'text-gray-600';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Created': return Package;
      case 'Harvested': return CheckCircle;
      case 'In Transit': return Truck;
      case 'At Retailer': return MapPin;
      case 'Selling': return Eye;
      default: return Package;
    }
  };

  const getStageBackground = (stage: string) => {
    switch (stage) {
      case 'Created': return 'bg-gray-50 border-l-4 border-gray-400';
      case 'Harvested': return 'bg-green-50 border-l-4 border-green-400';
      case 'In Transit': return 'bg-blue-50 border-l-4 border-blue-400';
      case 'At Retailer': return 'bg-purple-50 border-l-4 border-purple-400';
      case 'Selling': return 'bg-emerald-50 border-l-4 border-emerald-400';
      default: return 'bg-gray-50 border-l-4 border-gray-400';
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      // Use different endpoint based on user role
      const response = user?.role === UserRole.ADMIN 
        ? await backendService.getAllBatches()
        : await backendService.getBatchesByStage();
      
      if (response.success && response.data) {
        const batchData = Array.isArray(response.data) ? response.data : [];
        setBatches(batchData);
        
        // Optimize: Only process recent activity for first 10 batches
        const activity = batchData.slice(0, 10).flatMap(batch => 
          (batch.locationHistory || []).slice(0, 1).map(history => ({
            id: `${batch.batchId}-${history.timestamp}`,
            batchId: batch.batchId,
            productType: batch.productType,
            action: history.stage,
            location: history.location,
            timestamp: history.timestamp,
            updatedBy: history.updatedBy,
            stageIcon: getStageIcon(history.stage),
            stageColor: getStageColor(history.stage),
            stageBackground: getStageBackground(history.stage),
            isLatest: true,
            stageProgress: getStageProgress(history.stage)
          }))
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
        
        setRecentActivity(activity);
      } else {
        setBatches([]);
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      setBatches([]);
      setRecentActivity([]);
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen ocean-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-teal-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDashboardTitle = () => {
    switch (user.role) {
      case UserRole.ADMIN: return 'Admin Dashboard';
      case UserRole.PRODUCER: return 'Producer Dashboard';
      case UserRole.AGGREGATOR: return 'Aggregator Dashboard';
      case UserRole.RETAILER: return 'Retailer Dashboard';
      case UserRole.TRANSPORTER: return 'Transporter Dashboard';
      case UserRole.CONSUMER: return 'Consumer Overview';
      default: return 'Dashboard';
    }
  };

  // Admin Dashboard
  if (user.role === UserRole.ADMIN) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="space-y-3 pb-8">
          {/* Compact Header */}
          <div className="glass-card-dark text-white rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{getDashboardTitle()}</h1>
                <p className="text-teal-200 text-xs">System administration and monitoring</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-2 py-1 bg-teal-600 bg-opacity-50 rounded text-xs">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ultra Compact Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <Package className="h-4 w-4 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Transit</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.currentStage === 'In Transit').length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Store</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.currentStage === 'At Retailer').length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Alerts</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.reduce((acc, b) => acc + (b.alerts?.length || 0), 0) : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact System Status & Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="glass-card p-3">
              <h3 className="text-sm font-semibold text-teal-900 mb-2">System Status</h3>
              <AdminWallet />
            </div>

            <div className="glass-card p-3">
              <h3 className="text-sm font-semibold text-teal-900 mb-2">Recent Activity</h3>
              <div className="space-y-1">
                {recentActivity.length > 0 ? recentActivity.slice(0, 4).map((activity) => {
                  const StageIcon = activity.stageIcon || Package;
                  return (
                    <div key={activity.id} className={`p-2 rounded text-xs ${activity.stageBackground || getStageBackground(activity.action)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <StageIcon className={`w-4 h-4 ${activity.stageColor || 'text-gray-600'}`} />
                          <div>
                            <p className="font-semibold text-teal-900">{activity.batchId}</p>
                            <p className="text-gray-500 text-xs">{activity.productType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 text-xs">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-xs px-2 py-1 rounded ${activity.stageColor || 'text-gray-600'} bg-white bg-opacity-70`}>
                            {activity.action}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-700 font-medium text-xs">{activity.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {activity.stageProgress && (
                            <div className="w-12 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-teal-600 h-1 rounded-full transition-all duration-300" 
                                style={{ width: `${activity.stageProgress}%` }}
                              ></div>
                            </div>
                          )}
                          <span className="text-gray-400 text-xs">{activity.updatedBy}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-2">
                    <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">No activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex space-x-2">
            <button 
              onClick={() => router.push('/consumer-audit')}
              className="btn-primary flex items-center space-x-1 flex-1 text-sm py-2"
            >
              <QrCode className="h-3 w-3" />
              <span>QR Scanner</span>
            </button>
            <button 
              onClick={loadDashboardData}
              className="btn-secondary flex items-center space-x-1 text-sm py-2 px-3"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Compact Batch List */}
          {Array.isArray(batches) && batches.length > 0 && (
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-teal-900">System Batches ({batches.length})</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Admin</span>
              </div>
              
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {batches.map((batch) => (
                  <div key={batch.batchId} className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50 bg-opacity-50">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${batch.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <h4 className="font-semibold text-teal-900 text-xs">{batch.batchId}</h4>
                        <p className="text-xs text-gray-600">{batch.productType} • {getDisplayStage(batch.currentStage, user?.role)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{batch.currentLocation}</p>
                      {batch.locationHistory && batch.locationHistory[0] && (
                        batch.locationHistory[0].transactionHash.startsWith('0x') && batch.locationHistory[0].transactionHash.length === 66 ? (
                          <a
                            href={`https://explorer-mezame.shardeum.org/tx/${batch.locationHistory[0].transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                            title="View transaction on Shardeum Explorer"
                          >
                            <ExternalLink className="h-2 w-2" />
                            <span>TX</span>
                          </a>
                        ) : (
                          <span 
                            className="text-gray-400 text-xs flex items-center space-x-1 cursor-not-allowed"
                            title="Demo transaction - not available on explorer"
                          >
                            <ExternalLink className="h-2 w-2" />
                            <span>Demo</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Aggregator/Producer Dashboard (Creates Batches)
  if (user.role === UserRole.AGGREGATOR || user.role === UserRole.PRODUCER) {
    const roleTitle = user.role === UserRole.PRODUCER ? 'Producer Dashboard' : 'Aggregator Dashboard';
    return (
      <DashboardLayout title={roleTitle}>
        <div className="space-y-3 pb-8">
          {/* Compact Header */}
          <div className="glass-card-dark text-white rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{getDashboardTitle()}</h1>
                <p className="text-teal-200 text-xs">Record harvests in DB • Manage blockchain batches</p>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => router.push('/professional')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Create</span>
                </button>
                <button 
                  onClick={loadDashboardData}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="bg-white bg-opacity-10 hover:bg-opacity-30 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Marketplace</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ultra Compact Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <Package className="h-4 w-4 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-600">Created</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Active</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.isActive).length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Transit</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.currentStage === 'In Transit').length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Alerts</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.reduce((acc, b) => acc + (b.alerts?.length || 0), 0) : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Action Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card p-3 text-center">
              <ShoppingBag className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-teal-900 mb-1">Record Harvest</h3>
              <p className="text-gray-600 text-xs mb-2">Log parent batch to DB</p>
              <button 
                onClick={() => router.push('/marketplace')}
                className="btn-primary w-full text-xs py-1.5"
              >
                Record
              </button>
            </div>

            <div className="glass-card p-3 text-center">
              <Plus className="h-8 w-8 text-teal-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-teal-900 mb-1">Create Batch</h3>
              <p className="text-gray-600 text-xs mb-2">Direct blockchain entry</p>
              <button 
                onClick={() => router.push('/professional')}
                className="btn-secondary w-full text-xs py-1.5"
              >
                Create
              </button>
            </div>

            <div className="glass-card p-3 text-center">
              <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-teal-900 mb-1">QR Scanner</h3>
              <p className="text-gray-600 text-xs mb-2">Verify existing batches</p>
              <button 
                onClick={() => router.push('/consumer-audit')}
                className="btn-secondary w-full text-xs py-1.5"
              >
                Scan
              </button>
            </div>
          </div>

          {/* Compact Created Batches */}
          {Array.isArray(batches) && batches.length > 0 ? (
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-teal-900">Created Batches ({batches.length})</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Latest First</span>
              </div>
              
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {batches.map((batch) => (
                  <div key={batch.batchId} className="border border-gray-200 rounded p-2 bg-gray-50 bg-opacity-50">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="font-semibold text-teal-900 text-xs">{batch.batchId}</h4>
                        <p className="text-xs text-gray-600">{batch.productType}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStageColor(batch.currentStage)} bg-white bg-opacity-70`}>
                          {batch.currentStage}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{batch.currentLocation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(batch.created).toLocaleDateString()}</span>
                      {batch.locationHistory && batch.locationHistory[0] && (
                        batch.locationHistory[0].transactionHash.startsWith('0x') && batch.locationHistory[0].transactionHash.length === 66 ? (
                          <a
                            href={`https://explorer-mezame.shardeum.org/tx/${batch.locationHistory[0].transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            title="View transaction on Shardeum Explorer"
                          >
                            <ExternalLink className="h-2 w-2" />
                            <span>TX</span>
                          </a>
                        ) : (
                          <span 
                            className="text-gray-400 flex items-center space-x-1 cursor-not-allowed"
                            title="Demo transaction - not available on explorer"
                          >
                            <ExternalLink className="h-2 w-2" />
                            <span>Demo</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card text-center py-6">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No Batches Created</h3>
              <p className="text-gray-600 text-xs mb-3">Create your first batch to start tracking.</p>
              <button 
                onClick={() => router.push('/professional')}
                className="btn-primary flex items-center space-x-1 mx-auto text-xs py-1.5 px-3"
              >
                <Plus className="h-3 w-3" />
                <span>Create First Batch</span>
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Retailer Dashboard
  if (user.role === UserRole.RETAILER) {
    return (
      <DashboardLayout title="Retailer Dashboard">
        <div className="space-y-3 pb-8">
          {/* Compact Header */}
          <div className="glass-card-dark text-white rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{getDashboardTitle()}</h1>
                <p className="text-teal-200 text-xs">View batch details and workflow stages</p>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={loadDashboardData}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
                <button 
                  onClick={() => router.push('/consumer-audit')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>Scan</span>
                </button>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="bg-white bg-opacity-10 hover:bg-opacity-30 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Marketplace</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ultra Compact Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <Package className="h-4 w-4 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Transit</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.currentStage === 'In Transit').length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-2">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Store</p>
                  <p className="text-sm font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.currentStage === 'At Retailer').length : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ultra Compact Batch List */}
          {Array.isArray(batches) && batches.length > 0 ? (
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-teal-900">Your At Retailer Batches ({(() => {
                  const filtered = batches.filter(b => 
                    b.currentStage === 'At Retailer' && 
                    (b.updatedBy === user?.username || b.updatedBy === user?.email)
                  );
                  return filtered.length;
                })()})</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Scanned by you</span>
              </div>
              
              <div className="space-y-1.5">
                {(() => {
                  const filtered = batches.filter(b => 
                    b.currentStage === 'At Retailer' && 
                    (b.updatedBy === user?.username || b.updatedBy === user?.email)
                  );
                  return filtered.length > 0 ? filtered.map((batch) => (
                  <div key={batch.batchId} className="border border-gray-200 rounded p-2 bg-gray-50 bg-opacity-50">
                    {/* Ultra Compact Batch Header */}
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="font-semibold text-teal-900 text-xs">{batch.batchId}</h4>
                        <p className="text-xs text-gray-600">{batch.productType}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStageColor(batch.currentStage)} bg-white bg-opacity-70`}>
                          {getDisplayStage(batch.currentStage, user?.role)}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{batch.currentLocation}</p>
                      </div>
                    </div>

                    {/* Ultra Compact Timeline */}
                    <div className="border-t border-gray-200 pt-1 mt-1">
                      <div className="grid grid-cols-2 gap-1">
                        {batch.locationHistory && batch.locationHistory.length > 0 ? (
                          batch.locationHistory.slice(0, 2).map((history, index) => (
                            <div key={index} className="flex items-center space-x-1 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                index === 0 ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 truncate text-xs">{history.stage}</span>
                                  <span className="text-gray-500 ml-1 text-xs">
                                    {new Date(history.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-600 truncate text-xs">{history.location}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 col-span-2">No history</p>
                        )}
                      </div>
                    </div>

                    {/* Compact Alerts */}
                    {batch.alerts && batch.alerts.length > 0 && (
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-800">
                            {batch.alerts.length} alert{batch.alerts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <p>No batches at retailer stage scanned by you.</p>
                      <p className="text-xs mt-1">Scan a QR code to add batches to your dashboard.</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="glass-card text-center py-6">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No Batches Available</h3>
              <p className="text-gray-600 text-xs mb-3">No batches found to display workflow information.</p>
              <button 
                onClick={loadDashboardData}
                className="btn-secondary flex items-center space-x-1 mx-auto text-xs py-1.5 px-3"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh Data</span>
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Transporter Dashboard
  if (user.role === UserRole.TRANSPORTER) {
    return (
      <DashboardLayout title="Transporter Dashboard">
        <div className="space-y-6 pb-24">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
            <p className="text-teal-700 mt-2">Manage batch transportation</p>
          </div>

          {/* Stats Card */}
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-teal-900">Batches in Transit</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <Truck className="h-6 w-6 text-emerald-600" />
                  <span className="text-3xl font-bold text-teal-900">
                    {Array.isArray(batches) ? batches.filter(b => b.currentStage === 'In Transit').length : 0}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-emerald-600">
                <Package className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex space-x-4">
            <button 
              onClick={() => router.push('/professional')}
              className="btn-primary flex items-center space-x-2 w-full justify-center"
            >
              <span>Manage Batches</span>
            </button>
          </div>

          {/* Batch List */}
          {(() => {
            const userBatches = Array.isArray(batches) 
              ? batches.filter(b => 
                  b.currentStage === 'In Transit' && 
                  (b.updatedBy === user?.username || b.updatedBy === user?.email)
                )
              : [];
            
            return userBatches.length > 0 && (
              <div className="metric-card">
                <h3 className="text-lg font-semibold text-teal-900 mb-4">Your In Transit Batches ({userBatches.length})</h3>
                <div className="space-y-3">
                  {userBatches.map((batch) => (
                    <div key={batch.batchId} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${batch.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <h4 className="font-bold text-teal-900">{batch.batchId}</h4>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {getDisplayStage(batch.currentStage, user?.role)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Product</p>
                          <p className="text-gray-900 font-medium">{batch.productType}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p className="text-gray-900 font-medium">{batch.currentLocation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Professional Tools Link */}
          <div className="metric-card text-center py-8">
            <Truck className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-teal-900 mb-2">Transport Management</h3>
            <p className="text-gray-600 mb-4">Update batch locations and report transport status.</p>
            <button 
              onClick={() => router.push('/professional')}
              className="btn-primary"
            >
              Open Transport Tools
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Consumer Dashboard
  return (
    <DashboardLayout title="Consumer Overview">
      <div className="space-y-6 pb-24">
        {/* Consumer QR Scanning */}
        <div className="metric-card text-center py-12">
          <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-teal-900 mb-2">Consumer Access</h2>
          <p className="text-gray-600 mb-6">
            Scan QR codes with your device camera to view product information and verify authenticity.
          </p>
          <button
            onClick={() => router.push('/consumer-audit')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <QrCode className="h-5 w-5" />
            <span>Start QR Scanning</span>
          </button>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="metric-card">
            <h3 className="text-lg font-semibold text-teal-900 mb-4">How to Scan</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Find the QR code on the product packaging</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Click "Start QR Scanning" above</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Point your camera at the QR code</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>View complete product journey</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <h3 className="text-lg font-semibold text-teal-900 mb-4">What You'll See</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Product origin and type</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Complete supply chain timeline</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Quality and freshness status</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Blockchain verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;