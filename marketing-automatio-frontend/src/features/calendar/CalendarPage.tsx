import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Card } from '../../components/ui/Card';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Webhook,
  Hand,
  AlertTriangle,
  Repeat,
  Loader2
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { API_ENDPOINTS } from '../../lib/constants';
import { useToastStore } from '../../store/toastStore';

type TriggerType = 'manual' | 'scheduled' | 'webhook';
type RecurrenceType = 'once' | 'daily' | 'weekly' | 'custom';
type Platform = 'instagram' | 'linkedin' | 'facebook';

interface ScheduledPost {
  id: string;
  title: string;
  date: Date;
  time: string;
  platform: Platform;
  triggerType: TriggerType;
  recurrence?: RecurrenceType;
}

const POSTING_LIMITS = {
  instagram: { max: 2, label: '2 posts/day' },
  linkedin: { max: 5, label: '5 posts/day' },
  facebook: { max: 4, label: '4 posts/day' },
};

export const CalendarPage = () => {
  const { success, error: showError } = useToastStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Posts aus der Datenbank laden
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(API_ENDPOINTS.POSTS.LIST);
        const postsData = (response as any)?.data || response;

        if (Array.isArray(postsData)) {
          // Konvertiere Backend-Posts zu Calendar-Format
          const calendarPosts: ScheduledPost[] = postsData
            .filter((p: any) => p.scheduledAt) // Nur geplante Posts
            .map((p: any) => {
              const scheduledDate = new Date(p.scheduledAt);
              return {
                id: p.id,
                title: p.title || p.content?.substring(0, 30) + '...',
                date: scheduledDate,
                time: scheduledDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                platform: (p.platforms?.[0] || 'instagram') as Platform,
                triggerType: 'scheduled' as TriggerType,
                recurrence: 'once' as RecurrenceType,
              };
            });
          setScheduledPosts(calendarPosts);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Form state for new post
  const [newPost, setNewPost] = useState({
    title: '',
    date: '',
    time: '',
    platform: 'instagram' as Platform,
    triggerType: 'scheduled' as TriggerType,
    recurrence: 'once' as RecurrenceType,
    customFrequency: '3',
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getPostsForDate = (day: number) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.date);
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === currentDate.getMonth() &&
        postDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getPostCountByPlatform = (day: number) => {
    const posts = getPostsForDate(day);
    const counts = {
      instagram: posts.filter(p => p.platform === 'instagram').length,
      linkedin: posts.filter(p => p.platform === 'linkedin').length,
      facebook: posts.filter(p => p.platform === 'facebook').length,
    };
    return counts;
  };

  const hasWarning = (day: number) => {
    const counts = getPostCountByPlatform(day);
    return (
      counts.instagram > POSTING_LIMITS.instagram.max ||
      counts.linkedin > POSTING_LIMITS.linkedin.max ||
      counts.facebook > POSTING_LIMITS.facebook.max
    );
  };

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.date || !newPost.time) return;

    setIsSaving(true);
    try {
      // Post in der Datenbank speichern
      const scheduledAt = new Date(`${newPost.date}T${newPost.time}`).toISOString();

      const response = await api.post(API_ENDPOINTS.POSTS.CREATE, {
        title: newPost.title,
        content: newPost.title, // Content ist Pflichtfeld
        platforms: [newPost.platform],
        status: 'scheduled',
        scheduledAt: scheduledAt,
      });

      const savedPost = (response as any)?.data || response;

      // Lokalen State aktualisieren
      const post: ScheduledPost = {
        id: savedPost?.id || Date.now().toString(),
        title: newPost.title,
        date: new Date(newPost.date),
        time: newPost.time,
        platform: newPost.platform,
        triggerType: newPost.triggerType,
        recurrence: newPost.recurrence,
      };

      setScheduledPosts([...scheduledPosts, post]);
      setShowAddModal(false);
      setNewPost({
        title: '',
        date: '',
        time: '',
        platform: 'instagram',
        triggerType: 'scheduled',
        recurrence: 'once',
        customFrequency: '3',
      });

      success('Post erfolgreich geplant!');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const platformColors = {
    instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
    linkedin: 'bg-blue-600',
    facebook: 'bg-blue-700',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header 
          title="Content Calendar" 
          subtitle="Manage your posting schedule and workflow triggers"
        />
        
        <main className="flex-1 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Section */}
            <div className="lg:col-span-2 space-y-6">
             

              {/* Calendar Card */}
              <Card className="p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day names */}
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Calendar days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const posts = getPostsForDate(day);
                    const isToday = 
                      day === new Date().getDate() &&
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear();
                    const warning = hasWarning(day);

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        className={`aspect-square p-2 border rounded-lg cursor-pointer transition-all hover:border-indigo-300 hover:shadow-sm ${
                          isToday ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'
                        } ${warning ? 'border-orange-300 bg-orange-50' : ''}`}
                      >
                        <div className="h-full flex flex-col">
                          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          <div className="flex-1 space-y-1 overflow-hidden">
                            {posts.slice(0, 2).map(post => (
                              <div
                                key={post.id}
                                className={`text-xs text-white px-1 py-0.5 rounded truncate ${platformColors[post.platform]}`}
                                title={post.title}
                              >
                                {post.time} {post.title}
                              </div>
                            ))}
                            {posts.length > 2 && (
                              <div className="text-xs text-gray-600 px-1">
                                +{posts.length - 2} more
                              </div>
                            )}
                          </div>
                          {warning && (
                            <AlertTriangle className="text-orange-500 ml-auto" size={12} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Add New Schedule Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Schedule New Post
              </button>

             
              {/* Upcoming Posts */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Upcoming Posts</h3>
                <div className="space-y-3">
                  {scheduledPosts
                    .filter(post => post.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map(post => (
                      <div key={post.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 ${platformColors[post.platform]} rounded flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">
                            {post.platform[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{post.title}</p>
                          <p className="text-xs text-gray-600">
                            {post.date.toLocaleDateString()} at {post.time}
                          </p>
                        </div>
                        {post.recurrence !== 'once' && (
                          <Repeat className="text-gray-400 flex-shrink-0" size={16} />
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Add Post Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Schedule New Post</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Title
                    </label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Enter post title..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newPost.date}
                        onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={newPost.time}
                        onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Platform */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={newPost.platform}
                      onChange={(e) => setNewPost({ ...newPost, platform: e.target.value as Platform })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>

                  {/* Trigger Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'scheduled', label: 'Scheduled', icon: Clock },
                        { value: 'manual', label: 'Manual', icon: Hand },
                        { value: 'webhook', label: 'Webhook', icon: Webhook },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setNewPost({ ...newPost, triggerType: value as TriggerType })}
                          className={`p-3 border rounded-lg transition-all ${
                            newPost.triggerType === value
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="mx-auto mb-1" size={20} />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recurrence Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Repeat size={16} />
                        Recurrence
                      </div>
                    </label>
                    <select
                      value={newPost.recurrence}
                      onChange={(e) => setNewPost({ ...newPost, recurrence: e.target.value as RecurrenceType })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                    >
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom (e.g., 3x/week)</option>
                    </select>

                    {newPost.recurrence === 'custom' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="7"
                          value={newPost.customFrequency}
                          onChange={(e) => setNewPost({ ...newPost, customFrequency: e.target.value })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <span className="text-gray-700">times per week</span>
                      </div>
                    )}
                  </div>

                  {/* Frequency Warning */}
                  {newPost.platform && newPost.date && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="text-yellow-600 flex-shrink-0" size={16} />
                        <p className="text-sm text-yellow-800">
                          Remember: Maximum recommended posting frequency for {newPost.platform} is{' '}
                          {POSTING_LIMITS[newPost.platform].label}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowAddModal(false)}
                      disabled={isSaving}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPost}
                      disabled={!newPost.title || !newPost.date || !newPost.time || isSaving}
                      className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Speichern...
                        </>
                      ) : (
                        'Schedule Post'
                      )}
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

export default CalendarPage;
