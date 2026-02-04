import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Card } from '../../components/ui/Card';
import {
  Sparkles,
  Image as ImageIcon,
  FileText,
  Send,
  Calendar,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Trash2,
  TrendingUp,
  Info,
  Play,
  Images,
  Type,
  FileImage,
  Check
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { API_ENDPOINTS } from '../../lib/constants';
import { useToastStore } from '../../store/toastStore';

type Platform = 'linkedin' | 'instagram' | 'facebook';
type PostType = 'text' | 'image' | 'carousel' | 'reel' | 'article' | 'story';

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
  color: string;
  charLimit: number;
  postTypes: PostType[];
  engagement: { type: PostType; rate: string; tip: string }[];
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'in',
    color: 'bg-blue-600',
    charLimit: 3000,
    postTypes: ['text', 'image', 'carousel', 'article'],
    engagement: [
      { type: 'carousel', rate: '6.6%', tip: 'Karussells haben das höchste Engagement!' },
      { type: 'image', rate: '6.1%', tip: 'Multi-Image Posts performen sehr gut' },
      { type: 'article', rate: '2.5%', tip: 'Gut für Thought Leadership' },
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'ig',
    color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
    charLimit: 2200,
    postTypes: ['image', 'carousel', 'reel', 'story'],
    engagement: [
      { type: 'reel', rate: '2x', tip: 'Reels haben 2x mehr Engagement als statische Posts!' },
      { type: 'carousel', rate: '+20%', tip: 'Bis zu 20 Slides möglich seit 2024' },
      { type: 'story', rate: 'hoch', tip: 'Ideal für zeitkritische Inhalte' },
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fb',
    color: 'bg-blue-700',
    charLimit: 63206,
    postTypes: ['text', 'image', 'reel', 'story'],
    engagement: [
      { type: 'image', rate: '+35%', tip: 'Fotos haben 35% mehr Engagement als Text' },
      { type: 'reel', rate: 'hoch', tip: 'Reels werden vom Algorithmus bevorzugt' },
      { type: 'story', rate: 'hoch', tip: 'Vollbild-Format für mehr Aufmerksamkeit' },
    ]
  }
];

const POST_TYPES: { id: PostType; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'text', name: 'Nur Text', icon: <Type size={24} />, description: 'Einfacher Text-Post ohne Medien' },
  { id: 'image', name: 'Text + Bild', icon: <FileImage size={24} />, description: 'Text mit einem Bild' },
  { id: 'carousel', name: 'Karussell', icon: <Images size={24} />, description: 'Mehrere Bilder zum Durchblättern' },
  { id: 'reel', name: 'Reel / Video', icon: <Play size={24} />, description: 'Kurzes vertikales Video (9:16)' },
  { id: 'article', name: 'Artikel', icon: <FileText size={24} />, description: 'Langer Artikel (nur LinkedIn)' },
  { id: 'story', name: 'Story', icon: <ImageIcon size={24} />, description: '24h sichtbarer Vollbild-Content' },
];

export const CreatePostPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  // Step 2: Post Type
  const [postType, setPostType] = useState<PostType>('image');

  // Step 3: Content
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');

  // Step 4: Media
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Step 5: Schedule
  const [publishOption, setPublishOption] = useState<'now' | 'schedule'>('schedule');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Loading states
  const [isSaving, setIsSaving] = useState(false);

  // Get available post types based on selected platforms
  const getAvailablePostTypes = (): PostType[] => {
    if (selectedPlatforms.length === 0) return [];

    const platformConfigs = PLATFORMS.filter(p => selectedPlatforms.includes(p.id));
    const allTypes = platformConfigs.map(p => p.postTypes);

    // Get intersection of all platform post types
    return allTypes.reduce((acc, types) => acc.filter(t => types.includes(t)));
  };

  // Get engagement tip for current selection
  const getEngagementTip = () => {
    const tips: string[] = [];
    selectedPlatforms.forEach(platformId => {
      const platform = PLATFORMS.find(p => p.id === platformId);
      const engagement = platform?.engagement.find(e => e.type === postType);
      if (engagement) {
        tips.push(`${platform?.name}: ${engagement.tip} (${engagement.rate})`);
      }
    });
    return tips;
  };

  // Get minimum char limit across selected platforms
  const getCharLimit = () => {
    const limits = selectedPlatforms.map(id => PLATFORMS.find(p => p.id === id)?.charLimit || 3000);
    return Math.min(...limits);
  };

  // Platform toggle
  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      const newPlatforms = prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform];

      // Reset post type if it's not available for new platform selection
      if (newPlatforms.length > 0) {
        const available = getAvailablePostTypesFor(newPlatforms);
        if (!available.includes(postType)) {
          setPostType(available[0] || 'image');
        }
      }

      return newPlatforms;
    });
  };

  const getAvailablePostTypesFor = (platforms: Platform[]): PostType[] => {
    if (platforms.length === 0) return [];
    const platformConfigs = PLATFORMS.filter(p => platforms.includes(p.id));
    const allTypes = platformConfigs.map(p => p.postTypes);
    return allTypes.reduce((acc, types) => acc.filter(t => types.includes(t)));
  };

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = postType === 'carousel' ? 20 : 1;
    const remainingSlots = maxImages - uploadedImages.length;

    Array.from(files).slice(0, remainingSlots).forEach(file => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(file);
      setUploadedImages(prev => [...prev, { id, file, preview }]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return selectedPlatforms.length > 0;
      case 2: return postType !== null;
      case 3: return content.trim().length > 0;
      case 4: {
        if (postType === 'text' || postType === 'article') return true;
        if (postType === 'carousel') return uploadedImages.length >= 2;
        return uploadedImages.length >= 1 || postType === 'reel';
      }
      case 5: {
        if (publishOption === 'now') return true;
        return scheduleDate && scheduleTime;
      }
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit
  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // Titel aus den ersten 50 Zeichen des Contents generieren
      const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');

      const postData: any = {
        title: title,
        content: content,
        platforms: selectedPlatforms,
        contentType: postType,
        hashtags: hashtags.split(' ').filter(h => h.startsWith('#')),
        status: publishOption === 'now' ? 'review' : 'scheduled',
      };

      if (publishOption === 'schedule' && scheduleDate && scheduleTime) {
        postData.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      // TODO: Handle image upload to storage service
      if (uploadedImages.length > 0) {
        postData.imageUrls = uploadedImages.map(img => img.preview); // Temporary - should be real URLs
      }

      const response = await api.post(API_ENDPOINTS.POSTS.CREATE, postData);

      if (publishOption === 'now') {
        const postId = (response as any)?.data?.id || (response as any)?.id;
        if (postId) {
          await api.post(API_ENDPOINTS.POSTS.PUBLISH(postId), {});
          success('Post wird veröffentlicht!');
        }
        navigate('/dashboard');
      } else {
        success('Post erfolgreich geplant!');
        navigate('/dashboard/calendar');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Plattformen wählen</h2>
              <p className="text-gray-600">Auf welchen Plattformen möchtest du posten?</p>
            </div>

            <div className="grid gap-4">
              {PLATFORMS.map(platform => (
                <label
                  key={platform.id}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                    {platform.icon.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{platform.name}</p>
                    <p className="text-sm text-gray-500">Max. {platform.charLimit.toLocaleString()} Zeichen</p>
                  </div>
                  {selectedPlatforms.includes(platform.id) && (
                    <Check className="text-indigo-600" size={24} />
                  )}
                </label>
              ))}
            </div>

            {/* Engagement Tips */}
            {selectedPlatforms.length > 0 && (
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-start gap-3">
                  <TrendingUp className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-green-900 mb-2">Engagement-Tipps</p>
                    <ul className="space-y-1">
                      {selectedPlatforms.map(platformId => {
                        const platform = PLATFORMS.find(p => p.id === platformId);
                        const topEngagement = platform?.engagement[0];
                        return topEngagement && (
                          <li key={platformId} className="text-sm text-green-800">
                            <strong>{platform?.name}:</strong> {topEngagement.tip} ({topEngagement.rate})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 2:
        const availableTypes = getAvailablePostTypes();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Post-Typ wählen</h2>
              <p className="text-gray-600">Welche Art von Post möchtest du erstellen?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {POST_TYPES.filter(type => availableTypes.includes(type.id)).map(type => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id)}
                  className={`p-5 border-2 rounded-xl text-left transition-all ${
                    postType === type.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                    postType === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {type.icon}
                  </div>
                  <p className="font-semibold text-gray-900">{type.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>

            {/* Engagement Tips for selected type */}
            {getEngagementTip().length > 0 && (
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-blue-900 mb-2">Für "{POST_TYPES.find(t => t.id === postType)?.name}"</p>
                    <ul className="space-y-1">
                      {getEngagementTip().map((tip, i) => (
                        <li key={i} className="text-sm text-blue-800">{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 3:
        const charLimit = getCharLimit();
        const charCount = content.length;
        const isOverLimit = charCount > charLimit;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Content erstellen</h2>
              <p className="text-gray-600">Schreibe deinen Post-Text</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Post-Text</label>
                <span className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Was möchtest du teilen? ..."
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors ${
                  isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                rows={8}
              />
              {isOverLimit && (
                <p className="text-sm text-red-600 mt-1">
                  Text ist zu lang für {selectedPlatforms.map(p => PLATFORMS.find(pl => pl.id === p)?.name).join(' & ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags (optional)
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#marketing #socialmedia #business"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* AI Button (disabled for now) */}
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
            >
              <Sparkles size={20} />
              Mit AI verbessern (coming soon)
            </button>
          </div>
        );

      case 4:
        const maxImages = postType === 'carousel' ? 20 : 1;
        const needsMedia = postType !== 'text' && postType !== 'article';

        if (!needsMedia) {
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Medien (Optional)</h2>
                <p className="text-gray-600">Für "{POST_TYPES.find(t => t.id === postType)?.name}" sind keine Medien erforderlich.</p>
              </div>

              <Card className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Dein Post wird nur Text enthalten.</p>
                <p className="text-sm text-gray-500 mt-2">Du kannst zum nächsten Schritt weitergehen.</p>
              </Card>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Medien hinzufügen</h2>
              <p className="text-gray-600">
                {postType === 'carousel'
                  ? `Lade 2-${maxImages} Bilder für dein Karussell hoch`
                  : postType === 'reel'
                    ? 'Lade ein Video (9:16) hoch'
                    : 'Lade ein Bild hoch'
                }
              </p>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="font-medium text-gray-900">Klicken zum Hochladen</p>
              <p className="text-sm text-gray-500 mt-1">oder per Drag & Drop</p>
              <p className="text-xs text-gray-400 mt-2">
                Empfohlen: 1080x1350px (Portrait) für bestes Engagement
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={postType === 'carousel'}
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {uploadedImages.map((img, index) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}

                {/* Add more button */}
                {uploadedImages.length < maxImages && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <Upload size={24} />
                    <span className="text-xs mt-1">Mehr</span>
                  </button>
                )}
              </div>
            )}

            {/* Carousel Requirements */}
            {postType === 'carousel' && uploadedImages.length < 2 && (
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <Info size={16} />
                Ein Karussell benötigt mindestens 2 Bilder
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Veröffentlichung</h2>
              <p className="text-gray-600">Wann soll dein Post veröffentlicht werden?</p>
            </div>

            {/* Preview Summary */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Zusammenfassung</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plattformen:</span>
                  <span className="font-medium">{selectedPlatforms.map(p => PLATFORMS.find(pl => pl.id === p)?.name).join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Post-Typ:</span>
                  <span className="font-medium">{POST_TYPES.find(t => t.id === postType)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zeichen:</span>
                  <span className="font-medium">{content.length.toLocaleString()}</span>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bilder:</span>
                    <span className="font-medium">{uploadedImages.length}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Publish Options */}
            <div className="space-y-3">
              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  publishOption === 'schedule' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="publishOption"
                  checked={publishOption === 'schedule'}
                  onChange={() => setPublishOption('schedule')}
                  className="w-5 h-5 text-indigo-600"
                />
                <Calendar className="text-gray-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Planen</p>
                  <p className="text-sm text-gray-500">Wähle Datum und Uhrzeit</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  publishOption === 'now' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="publishOption"
                  checked={publishOption === 'now'}
                  onChange={() => setPublishOption('now')}
                  className="w-5 h-5 text-indigo-600"
                />
                <Send className="text-gray-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Jetzt veröffentlichen</p>
                  <p className="text-sm text-gray-500">Sofort auf allen Plattformen posten</p>
                </div>
              </label>
            </div>

            {/* Schedule Date/Time */}
            {publishOption === 'schedule' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uhrzeit</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header
          title="Neuer Post"
          subtitle="Erstelle und plane deinen Social Media Content"
        />

        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                      step === currentStep
                        ? 'bg-indigo-600 text-white'
                        : step < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < currentStep ? <Check size={20} /> : step}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Plattformen</span>
                <span>Post-Typ</span>
                <span>Content</span>
                <span>Medien</span>
                <span>Planen</span>
              </div>
            </div>

            {/* Step Content */}
            <Card className="p-6 mb-6">
              {renderStepContent()}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                Zurück
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canGoNext() || isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      {publishOption === 'now' ? <Send size={20} /> : <Calendar size={20} />}
                      {publishOption === 'now' ? 'Jetzt posten' : 'Post planen'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatePostPage;
