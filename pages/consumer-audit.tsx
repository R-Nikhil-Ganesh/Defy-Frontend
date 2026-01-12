import { NextPage } from 'next';
import { useState } from 'react';
import { Camera, Package, Search, CheckCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { getBackendService, BatchDetails } from '../lib/services/backendService';
import QRScanner from '../components/common/QRScanner';

const ConsumerAuditPage: NextPage = () => {
  const [batchId, setBatchId] = useState<string>('');
  const [batchData, setBatchData] = useState<BatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);

  const backendService = getBackendService();

  const handleSearch = async () => {
    if (!batchId.trim()) {
      setError('Please enter a batch ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setBatchData(null);

    try {
      const result = await backendService.getBatchDetails(batchId.trim());
      if (result.success && result.data) {
        setBatchData(result.data);
      } else {
        setError(result.error || 'Batch not found');
      }
    } catch (err) {
      setError('Failed to fetch batch details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    setShowScanner(false);
    setBatchId(qrData);
    
    // Auto-search after QR scan
    setIsLoading(true);
    setError('');
    setBatchData(null);

    try {
      const result = await backendService.getBatchDetails(qrData);
      if (result.success && result.data) {
        setBatchData(result.data);
      } else {
        setError(result.error || 'Batch not found');
      }
    } catch (err) {
      setError('Failed to fetch batch details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Created':
      case 'Harvested':
        return <Package className="h-4 w-4" />;
      case 'In Transit':
        return <Clock className="h-4 w-4" />;
      case 'At Retailer':
      case 'Selling':
        return <MapPin className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Created':
        return 'bg-gray-100 text-gray-700';
      case 'Harvested':
        return 'bg-green-100 text-green-700';
      case 'In Transit':
        return 'bg-blue-100 text-blue-700';
      case 'At Retailer':
        return 'bg-purple-100 text-purple-700';
      case 'Selling':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="header-bar">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-freshchain-primary rounded-lg flex items-center justify-center">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Consumer Audit</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Verify product authenticity</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-8 mb-8">
          <div className="text-center">
            <Camera className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-bold mb-4">Product Verification</h1>
            <p className="text-emerald-100 text-lg mb-6">
              Scan QR codes or enter batch IDs to verify product authenticity and view supply chain journey
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">No account required • Instant verification</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Verify Product</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="Enter batch ID (e.g., APPLE-001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-500 text-sm">or</span>
            <button
              onClick={() => setShowScanner(true)}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center mx-auto mt-2"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan QR Code
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card bg-red-50 border-red-200 mb-8">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Batch Details */}
        {batchData && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Product Information</h3>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Verified</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                  <div className="text-lg font-mono bg-gray-50 px-3 py-2 rounded border">
                    {batchData.batchId}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <div className="text-lg bg-gray-50 px-3 py-2 rounded border">
                    {batchData.productType}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="text-lg bg-gray-50 px-3 py-2 rounded border">
                    {formatDate(batchData.created)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                  <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${getStageColor(batchData.currentStage)}`}>
                    {getStageIcon(batchData.currentStage)}
                    <span className="font-medium">{batchData.currentStage}</span>
                  </div>
                </div>
              </div>

              {batchData.isFinalStage && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">Final Retail Stage Reached</span>
                  </div>
                  <p className="text-emerald-700 text-sm mt-1">
                    This product has completed its supply chain journey and is ready for sale.
                  </p>
                </div>
              )}
            </div>

            {/* Supply Chain Timeline */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Supply Chain Journey</h3>
              
              {batchData.locationHistory.length > 0 ? (
                <div className="space-y-4">
                  {batchData.locationHistory.map((update, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${getStageColor(update.stage)}`}>
                        {getStageIcon(update.stage)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">{update.stage}</h4>
                          <span className="text-sm text-gray-500">{formatDate(update.timestamp)}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{update.location}</p>
                        {update.updatedBy && (
                          <p className="text-xs text-gray-500 mt-1">Updated by: {update.updatedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No location history available yet</p>
                </div>
              )}
            </div>

            {/* Alerts */}
            {batchData.alerts.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Alerts & Issues</h3>
                <div className="space-y-4">
                  {batchData.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-orange-900">{alert.alertType}</h4>
                          <span className="text-sm text-orange-600">{formatDate(alert.timestamp)}</span>
                        </div>
                        <p className="text-orange-700 mt-1">{alert.encryptedData}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!batchData && !isLoading && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• Enter a batch ID in the search field above</p>
              <p>• Click "Scan QR Code" to use your device camera</p>
              <p>• All data is fetched in real-time from the blockchain</p>
              <p>• QR codes are typically found on product packaging</p>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <QRScanner
              onScan={handleQRScan}
              onError={(error) => {
                setError(error);
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerAuditPage;