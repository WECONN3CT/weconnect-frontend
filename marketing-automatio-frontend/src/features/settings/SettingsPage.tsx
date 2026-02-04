import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Card } from '../../components/ui/Card';
import {
  Link2,
  User,
  Settings,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Globe,
  Clock,
  Palette,
  Monitor,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { API_ENDPOINTS } from '../../lib/constants';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

type SettingsTab = 'connections' | 'profile' | 'preferences';
type Platform = 'instagram' | 'linkedin' | 'facebook';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';
type Theme = 'light' | 'dark' | 'system';

interface Connection {
  id: string;
  platform: Platform;
  status: ConnectionStatus;
  accountName?: string;
  accountId?: string;
  connectedAt?: Date;
  lastSync?: Date;
  expiresAt?: Date;
  errorMessage?: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
}

interface Preferences {
  language: 'de' | 'en';
  timezone: string;
  defaultPlatform: Platform | 'all';
  theme: Theme;
}

export const SettingsPage = () => {
  const { success: showSuccess, error: showError } = useToastStore();
  const { user, setUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('connections');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Connections State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showConnectModal, setShowConnectModal] = useState<Platform | null>(null);
  const [connectForm, setConnectForm] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    accountId: '',
  });

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    lastName: user?.lastName || user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    company: user?.company || '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Preferences State
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'de',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultPlatform: 'all',
    theme: 'system',
  });

  // Load connections from API
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(API_ENDPOINTS.CONNECTIONS.LIST);
        const data = (response as any)?.data || response;

        if (Array.isArray(data)) {
          const mappedConnections: Connection[] = data.map((c: any) => ({
            id: c.id,
            platform: c.platform as Platform,
            status: c.status === 'connected' ? 'connected' : c.status === 'error' ? 'error' : 'disconnected',
            accountName: c.accountName || c.platformUsername,
            accountId: c.accountId || c.platformUserId,
            connectedAt: c.connectedAt ? new Date(c.connectedAt) : undefined,
            lastSync: c.lastSync ? new Date(c.lastSync) : undefined,
            expiresAt: c.tokenExpiresAt ? new Date(c.tokenExpiresAt) : undefined,
            errorMessage: c.errorMessage,
          }));
          setConnections(mappedConnections);
        }
      } catch (err) {
        console.error('Failed to fetch connections:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const tabs = [
    { id: 'connections' as SettingsTab, label: 'Connections', icon: Link2 },
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'preferences' as SettingsTab, label: 'Preferences', icon: Settings },
  ];

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

  const timezones = [
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'Europe/Zurich',
    'Europe/Vienna',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  // Connection Handlers
  const getConnection = (platform: Platform) => connections.find(c => c.platform === platform);

  const getDaysUntilExpiry = (expiresAt?: Date) => {
    if (!expiresAt) return null;
    const days = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleConnect = async (platform: Platform) => {
    setIsSaving(true);
    try {
      const response = await api.post(API_ENDPOINTS.CONNECTIONS.CREATE, {
        platform,
        accessToken: connectForm.accessToken,
        accountId: connectForm.accountId || connectForm.appId,
        accountName: `@${platform}_account`,
      });

      const newConnection = (response as any)?.data || response;

      setConnections(prev => [
        ...prev.filter(c => c.platform !== platform),
        {
          id: newConnection.id,
          platform,
          status: 'connected',
          accountName: newConnection.accountName,
          accountId: newConnection.accountId,
          connectedAt: new Date(),
          lastSync: new Date(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }
      ]);

      setShowConnectModal(null);
      setConnectForm({ appId: '', appSecret: '', accessToken: '', accountId: '' });
      showSuccess(`${platformInfo[platform].name} erfolgreich verbunden!`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Verbindung fehlgeschlagen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (connectionId: string, platform: Platform) => {
    if (!confirm('Möchtest du diese Verbindung wirklich trennen?')) return;

    try {
      await api.delete(API_ENDPOINTS.CONNECTIONS.DELETE(connectionId));
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      showSuccess(`${platformInfo[platform].name} getrennt`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Fehler beim Trennen');
    }
  };

  const handleReconnect = async (connectionId: string) => {
    try {
      await api.post(API_ENDPOINTS.CONNECTIONS.RECONNECT(connectionId), {});
      setConnections(prev => prev.map(c =>
        c.id === connectionId
          ? { ...c, status: 'connected' as ConnectionStatus, lastSync: new Date(), errorMessage: undefined }
          : c
      ));
      showSuccess('Verbindung wiederhergestellt!');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Reconnect fehlgeschlagen');
    }
  };

  // Profile Handlers
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      // await api.put('/auth/profile', profile);

      // Update local state
      if (user) {
        setUser({
          ...user,
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: `${profile.firstName} ${profile.lastName}`,
          company: profile.company,
        });
      }

      showSuccess('Profil gespeichert!');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Passwörter stimmen nicht überein');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setIsSaving(true);
    try {
      // API call would go here
      // await api.put('/auth/password', passwordForm);

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      showSuccess('Passwort geändert!');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setIsSaving(false);
    }
  };

  // Preferences Handlers
  const handleSavePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));

    // Apply theme
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (preferences.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    showSuccess('Einstellungen gespeichert!');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header
          title="Settings"
          subtitle="Manage your account, connections and preferences"
        />

        <main className="flex-1 p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'connections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Social Media Connections</h2>
                  <p className="text-gray-600 text-sm mt-1">Verbinde deine Social Media Accounts für automatisches Posting</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            connection.status === 'connected' ? (
                              <CheckCircle2 className="text-green-600" size={24} />
                            ) : (
                              <XCircle className="text-red-600" size={24} />
                            )
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
                                  <span className="text-green-600 font-semibold">Verbunden</span>
                                ) : (
                                  <span className="text-red-600 font-semibold">Fehler</span>
                                )}
                              </p>
                              {connection.lastSync && (
                                <p className="mb-1">
                                  <span className="font-medium">Letzter Sync:</span>{' '}
                                  {connection.lastSync.toLocaleString('de-DE')}
                                </p>
                              )}
                              {connection.expiresAt && (
                                <p className="mb-1">
                                  <span className="font-medium">Läuft ab in:</span>{' '}
                                  <span className={getDaysUntilExpiry(connection.expiresAt)! < 7 ? 'text-red-600 font-semibold' : ''}>
                                    {getDaysUntilExpiry(connection.expiresAt)} Tagen
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
                                onClick={() => handleDisconnect(connection.id, platform)}
                                className="bg-white text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowConnectModal(platform)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            Verbinden
                          </button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
                <p className="text-gray-600 text-sm mt-1">Verwalte deine persönlichen Informationen</p>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Persönliche Daten</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vorname</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nachname</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unternehmen</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Speichern
                </button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Passwort ändern</h3>
                    <p className="text-sm text-gray-600">Aktualisiere dein Passwort regelmäßig für mehr Sicherheit</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-indigo-600 font-medium text-sm hover:text-indigo-700"
                  >
                    {showPasswordForm ? 'Abbrechen' : 'Ändern'}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelles Passwort</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Neues Passwort</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passwort bestätigen</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                      className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Passwort ändern
                    </button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
                <p className="text-gray-600 text-sm mt-1">Passe die App an deine Bedürfnisse an</p>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" />
                  Sprache & Region
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sprache</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value as 'de' | 'en' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="de">🇩🇪 Deutsch</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock size={14} />
                      Zeitzone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Palette size={18} className="text-indigo-600" />
                  Erscheinungsbild
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Hell', icon: Sun },
                      { value: 'dark', label: 'Dunkel', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setPreferences({ ...preferences, theme: value as Theme })}
                        className={`p-4 border rounded-lg transition-all flex flex-col items-center gap-2 ${
                          preferences.theme === value
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Link2 size={18} className="text-indigo-600" />
                  Posting Defaults
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Standard-Plattform für neue Posts</label>
                  <select
                    value={preferences.defaultPlatform}
                    onChange={(e) => setPreferences({ ...preferences, defaultPlatform: e.target.value as Platform | 'all' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Alle Plattformen</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="facebook">👥 Facebook</option>
                  </select>
                </div>
              </Card>

              <button
                onClick={handleSavePreferences}
                className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                Einstellungen speichern
              </button>
            </div>
          )}

          {/* Connect Modal */}
          {showConnectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${platformInfo[showConnectModal].color} rounded-xl flex items-center justify-center text-2xl`}>
                      {platformInfo[showConnectModal].icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {platformInfo[showConnectModal].name} verbinden
                      </h2>
                      <p className="text-sm text-gray-600">API Credentials eingeben</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConnectModal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App ID / Client ID</label>
                    <input
                      type="text"
                      value={connectForm.appId}
                      onChange={(e) => setConnectForm({ ...connectForm, appId: e.target.value })}
                      placeholder="Deine App ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
                    <input
                      type="password"
                      value={connectForm.appSecret}
                      onChange={(e) => setConnectForm({ ...connectForm, appSecret: e.target.value })}
                      placeholder="Dein App Secret"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                    <textarea
                      value={connectForm.accessToken}
                      onChange={(e) => setConnectForm({ ...connectForm, accessToken: e.target.value })}
                      placeholder="Dein Access Token"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-900">
                      <strong>Tipp:</strong> Du kannst auch OAuth nutzen für eine einfachere Verbindung.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowConnectModal(null)}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleConnect(showConnectModal)}
                      disabled={isSaving || !connectForm.accessToken}
                      className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
                      Verbinden
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

export default SettingsPage;
