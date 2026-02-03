import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Card } from '../../components/ui/Card';
import { 
  CheckCircle2, 
  XCircle, 
  Plus,
  Link2,
  RefreshCw,
  Trash2,
} from 'lucide-react';

type Platform = 'instagram' | 'linkedin' | 'facebook';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface Connection {
  id: string;
  platform: Platform;
  status: ConnectionStatus;
  accountName?: string;
  accountId?: string;
  connectedAt?: Date;
  lastSync?: Date;
  accessToken?: string;
  expiresAt?: Date;
  errorMessage?: string;
}

const mockConnections: Connection[] = [
  {
    id: '1',
    platform: 'instagram',
    status: 'connected',
    accountName: '@socialflow_official',
    accountId: 'IG-123456789',
    connectedAt: new Date(2026, 0, 15),
    lastSync: new Date(2026, 1, 2, 10, 30),
    expiresAt: new Date(2026, 2, 15),
  },
  {
    id: '2',
    platform: 'linkedin',
    status: 'error',
    accountName: 'SocialFlow Company',
    accountId: 'LI-987654321',
    connectedAt: new Date(2026, 0, 10),
    lastSync: new Date(2026, 1, 1),
    expiresAt: new Date(2026, 0, 31),
    errorMessage: 'Access token expired. Please reconnect your account.',
  },
];

export const AccountsPage = () => {
  const [connections, setConnections] = useState<Connection[]>(mockConnections);
  // const [showAddModal, setShowAddModal] = useState(false);
  // const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showInstagramForm, setShowInstagramForm] = useState(false);
  // const [showLinkedInForm, setShowLinkedInForm] = useState(false);

  // Instagram Form State
  const [instagramForm, setInstagramForm] = useState({
    appId: '',
    appSecret: '',
    businessAccountId: '',
    facebookPageId: '',
    accessToken: '',
  });

  // LinkedIn Form State (für spätere Verwendung)
  const [_linkedInForm, _setLinkedInForm] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    organizationId: '',
    accessToken: '',
  });

  const platformInfo = {
    instagram: {
      name: 'Instagram Business',
      icon: '📸',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
    },
    linkedin: {
      name: 'LinkedIn',
      icon: '💼',
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    facebook: {
      name: 'Facebook Page',
      icon: '👥',
      color: 'from-blue-700 to-blue-800',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  };

  const getConnection = (platform: Platform) => {
    return connections.find(c => c.platform === platform);
  };

  const handleConnectPlatform = (platform: Platform) => {
    // setSelectedPlatform(platform);
    if (platform === 'instagram') {
      setShowInstagramForm(true);
    // } else if (platform === 'linkedin') {
    //   setShowLinkedInForm(true);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      setConnections(connections.filter(c => c.id !== connectionId));
    }
  };

  const handleReconnect = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      handleConnectPlatform(connection.platform);
    }
  };

  const handleInstagramSubmit = () => {
    // Simulate OAuth connection
    const newConnection: Connection = {
      id: Date.now().toString(),
      platform: 'instagram',
      status: 'connected',
      accountName: '@your_account',
      accountId: instagramForm.businessAccountId,
      connectedAt: new Date(),
      lastSync: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    };

    setConnections([...connections.filter(c => c.platform !== 'instagram'), newConnection]);
    setShowInstagramForm(false);
    setInstagramForm({
      appId: '',
      appSecret: '',
      businessAccountId: '',
      facebookPageId: '',
      accessToken: '',
    });
  };

  // const handleLinkedInSubmit = () => {
  //   // Simulate OAuth connection
  //   const newConnection: Connection = {
  //     id: Date.now().toString(),
  //     platform: 'linkedin',
  //     status: 'connected',
  //     accountName: 'Your Company',
  //     accountId: linkedInForm.organizationId,
  //     connectedAt: new Date(),
  //     lastSync: new Date(),
  //     expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
  //   };

  //   setConnections([...connections.filter(c => c.platform !== 'linkedin'), newConnection]);
  //   setShowLinkedInForm(false);
  //   setLinkedInForm({
  //     clientId: '',
  //     clientSecret: '',
  //     redirectUri: '',
  //     organizationId: '',
  //     accessToken: '',
  //   });
  // };

  const getDaysUntilExpiry = (expiresAt?: Date) => {
    if (!expiresAt) return null;
    const now = new Date().getTime();
    const days = Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header 
          title="Connected Accounts" 
          subtitle="Manage your social media integrations and API credentials"
        />
        
        <main className="flex-1 p-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(['instagram', 'linkedin', 'facebook'] as Platform[]).map(platform => {
              const connection = getConnection(platform);
              const info = platformInfo[platform];

              return (
                <Card key={platform} className={`p-6 ${info.bgColor} border ${info.borderColor}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{info.name}</h3>
                        {connection && (
                          <p className="text-sm text-gray-600">{connection.accountName}</p>
                        )}
                      </div>
                    </div>
                    {connection ? (
                      <div>
                        {connection.status === 'connected' && (
                          <CheckCircle2 className="text-green-600" size={24} />
                        )}
                        {connection.status === 'error' && (
                          <XCircle className="text-red-600" size={24} />
                        )}
                      </div>
                    ) : (
                      <XCircle className="text-gray-400" size={24} />
                    )}
                  </div>

                  {connection ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-700">
                        <p className="mb-1">
                          <span className="font-medium">Status:</span>{' '}
                          {connection.status === 'connected' ? (
                            <span className="text-green-600 font-semibold">Connected</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Error</span>
                          )}
                        </p>
                        {connection.lastSync && (
                          <p className="mb-1">
                            <span className="font-medium">Last Sync:</span>{' '}
                            {connection.lastSync.toLocaleString()}
                          </p>
                        )}
                        {connection.expiresAt && (
                          <p className="mb-1">
                            <span className="font-medium">Expires in:</span>{' '}
                            <span className={getDaysUntilExpiry(connection.expiresAt)! < 7 ? 'text-red-600 font-semibold' : ''}>
                              {getDaysUntilExpiry(connection.expiresAt)} days
                            </span>
                          </p>
                        )}
                      </div>

                      {connection.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-red-800">{connection.errorMessage}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {connection.status === 'error' ? (
                          <button
                            onClick={() => handleReconnect(connection.id)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold py-2 px-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2"
                          >
                            <RefreshCw size={14} />
                            Reconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReconnect(connection.id)}
                            className="flex-1 bg-white text-gray-700 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-300"
                          >
                            <RefreshCw size={14} />
                            Refresh
                          </button>
                        )}
                        <button
                          onClick={() => handleDisconnect(connection.id)}
                          className="bg-white text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnectPlatform(platform)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Connect Account
                    </button>
                  )}
                </Card>
              );
            })}
          </div>

          

          {/* Instagram Connection Form Modal */}
          {showInstagramForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                      📸
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Connect Instagram</h2>
                      <p className="text-sm text-gray-600">Instagram Graph API Configuration</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInstagramForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Facebook App Credentials */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook App ID *
                    </label>
                    <input
                      type="text"
                      value={instagramForm.appId}
                      onChange={(e) => setInstagramForm({ ...instagramForm, appId: e.target.value })}
                      placeholder="Enter your Facebook App ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook App Secret *
                    </label>
                    <input
                      type="password"
                      value={instagramForm.appSecret}
                      onChange={(e) => setInstagramForm({ ...instagramForm, appSecret: e.target.value })}
                      placeholder="Enter your Facebook App Secret"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Instagram Business Account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram Business Account ID *
                    </label>
                    <input
                      type="text"
                      value={instagramForm.businessAccountId}
                      onChange={(e) => setInstagramForm({ ...instagramForm, businessAccountId: e.target.value })}
                      placeholder="Enter your Instagram Business Account ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Find this in your Facebook Business Manager
                    </p>
                  </div>

                  {/* Facebook Page */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Page ID *
                    </label>
                    <input
                      type="text"
                      value={instagramForm.facebookPageId}
                      onChange={(e) => setInstagramForm({ ...instagramForm, facebookPageId: e.target.value })}
                      placeholder="Enter your Facebook Page ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      The Facebook Page linked to your Instagram Business Account
                    </p>
                  </div>

                  {/* Access Token */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Long-Lived Access Token *
                    </label>
                    <textarea
                      value={instagramForm.accessToken}
                      onChange={(e) => setInstagramForm({ ...instagramForm, accessToken: e.target.value })}
                      placeholder="Paste your long-lived access token here"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
                      rows={3}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Generate a long-lived token (60 days) using Facebook's Graph API Explorer
                    </p>
                  </div>

                  {/* OAuth Alternative */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-900 mb-3">
                      <strong>Quick Setup:</strong> Skip manual configuration and connect via OAuth
                    </p>
                    <button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Link2 size={18} />
                      Connect with Facebook OAuth
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => setShowInstagramForm(false)}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInstagramSubmit}
                      disabled={!instagramForm.appId || !instagramForm.appSecret || !instagramForm.businessAccountId || !instagramForm.facebookPageId}
                      className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Connect Instagram
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          
            
          
        </main>
      </div>
    </div>
  );
};

export default AccountsPage;
