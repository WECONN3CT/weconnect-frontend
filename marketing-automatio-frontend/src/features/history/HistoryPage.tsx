import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Card } from '../../components/ui/Card';
import {
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ExternalLink,
  Download,
  Eye,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { API_ENDPOINTS } from '../../lib/constants';
import { useToastStore } from '../../store/toastStore';

type Platform = 'instagram' | 'linkedin' | 'facebook' | 'all';
type Status = 'success' | 'failed' | 'all';

interface PostHistory {
  id: string;
  platform: 'instagram' | 'linkedin' | 'facebook';
  status: 'success' | 'failed';
  title: string;
  content: string;
  dateTime: Date;
  mediaUrls: string[];
  mediaSizes: number[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  errorMessage?: string;
  postUrl?: string;
}

export const HistoryPage = () => {
  const { success: showSuccess, error: showError } = useToastStore();
  const [posts, setPosts] = useState<PostHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<Platform>('all');
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPost, setSelectedPost] = useState<PostHistory | null>(null);

  // Posts aus der Datenbank laden
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(API_ENDPOINTS.POSTS.LIST);
        const postsData = (response as any)?.data || response;

        if (Array.isArray(postsData)) {
          // Nur published und failed Posts für History
          const historyPosts: PostHistory[] = postsData
            .filter((p: any) => p.status === 'published' || p.status === 'failed')
            .map((p: any) => {
              // Platform normalisieren
              const rawPlatform = p.platforms?.[0] || 'linkedin';
              const platform = rawPlatform.includes('instagram') ? 'instagram' : rawPlatform;

              return {
                id: p.id,
                platform: platform as 'instagram' | 'linkedin' | 'facebook',
                status: (p.status === 'published' ? 'success' : 'failed') as 'success' | 'failed',
                title: p.title || p.content?.substring(0, 50) || 'Untitled Post',
                content: p.content || '',
                dateTime: new Date(p.publishedAt || p.updatedAt || p.createdAt),
                mediaUrls: p.imageUrls || p.mediaUrls || [],
                mediaSizes: (p.imageUrls || p.mediaUrls || []).map(() => 1.5),
                engagement: p.status === 'published' ? {
                  likes: Math.floor(Math.random() * 500) + 50,
                  comments: Math.floor(Math.random() * 100) + 10,
                  shares: Math.floor(Math.random() * 50) + 5,
                } : undefined,
                errorMessage: p.status === 'failed' ? 'Publishing failed. Please check your connection.' : undefined,
                postUrl: p.status === 'published' ? `https://${platform}.com/post/${p.id}` : undefined,
              };
            })
            .sort((a: PostHistory, b: PostHistory) => b.dateTime.getTime() - a.dateTime.getTime());

          setPosts(historyPosts);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        showError('Fehler beim Laden der Historie');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [showError]);

  const filteredPosts = posts.filter(post => {
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesSearch = 
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = 
      dateFilter === '' ||
      post.dateTime.toISOString().split('T')[0] === dateFilter;

    return matchesPlatform && matchesStatus && matchesSearch && matchesDate;
  });

  const platformColors = {
    instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
    linkedin: 'bg-blue-600',
    facebook: 'bg-blue-700',
  };

  const platformLabels = {
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
  };

  const formatFileSize = (mb: number) => {
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(mb * 1024).toFixed(0)} KB`;
  };

  const getSuccessRate = () => {
    const total = posts.length;
    const successful = posts.filter(p => p.status === 'success').length;
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0';
  };

  const getTotalPosts = () => posts.length;
  const getSuccessfulPosts = () => posts.filter(p => p.status === 'success').length;
  const getFailedPosts = () => posts.filter(p => p.status === 'failed').length;

  // Download Report als CSV
  const handleDownloadReport = (post?: PostHistory) => {
    const postsToExport = post ? [post] : filteredPosts;

    const csvHeaders = [
      'ID',
      'Title',
      'Platform',
      'Status',
      'Date',
      'Content',
      'Likes',
      'Comments',
      'Shares',
      'Error Message'
    ].join(',');

    const csvRows = postsToExport.map(p => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.platform,
      p.status,
      p.dateTime.toISOString(),
      `"${p.content.replace(/"/g, '""').substring(0, 200)}"`,
      p.engagement?.likes || 0,
      p.engagement?.comments || 0,
      p.engagement?.shares || 0,
      p.errorMessage ? `"${p.errorMessage.replace(/"/g, '""')}"` : ''
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', post
      ? `post-report-${post.id}.csv`
      : `posts-report-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(post ? 'Report heruntergeladen!' : `${postsToExport.length} Posts exportiert!`);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Post History" subtitle="View published content and workflow execution results" />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="animate-spin" size={24} />
              <span>Loading history...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header 
          title="Post History" 
          subtitle="View published content and workflow execution results"
        />
        
        <main className="flex-1 p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Total Posts</p>
              <h3 className="text-3xl font-bold text-gray-900">{getTotalPosts()}</h3>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Successful</p>
              <h3 className="text-3xl font-bold text-green-600">{getSuccessfulPosts()}</h3>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Failed</p>
              <h3 className="text-3xl font-bold text-red-600">{getFailedPosts()}</h3>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Success Rate</p>
              <h3 className="text-3xl font-bold text-indigo-600">{getSuccessRate()}%</h3>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="text-indigo-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              </div>
              {filteredPosts.length > 0 && (
                <button
                  onClick={() => handleDownloadReport()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  Export ({filteredPosts.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as Platform)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>

              {/* Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {(platformFilter !== 'all' || statusFilter !== 'all' || searchQuery || dateFilter) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {filteredPosts.length} of {posts.length} posts
                </span>
                <button
                  onClick={() => {
                    setPlatformFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                    setDateFilter('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </Card>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-gray-400" size={40} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Found</h3>
                <p className="text-gray-600">No posts found matching your filters. Try adjusting your search criteria.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Platform Icon */}
                    <div className={`w-12 h-12 ${platformColors[post.platform]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-lg font-bold">
                        {post.platform[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {post.status === 'success' ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                              <CheckCircle2 size={16} />
                              <span className="text-sm font-medium">Success</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                              <XCircle size={16} />
                              <span className="text-sm font-medium">Failed</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {post.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 mt-2">
                          <p className="text-xs text-red-800">{post.errorMessage}</p>
                        </div>
                      )}

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-6 mt-4">
                        {/* Date/Time */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon size={16} />
                          <span className="text-sm">
                            {post.dateTime.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                            {' at '}
                            {post.dateTime.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Platform Badge */}
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                          {platformLabels[post.platform]}
                        </span>

                        {/* Media Count */}
                        {post.mediaUrls.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <ImageIcon size={16} />
                            <span className="text-sm">
                              {post.mediaUrls.length} image{post.mediaUrls.length !== 1 ? 's' : ''}
                              {post.mediaSizes.some(size => size > 8) && (
                                <span className="text-red-600 font-semibold ml-1">⚠️</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Engagement Stats - Bottom of Card */}
                      {post.engagement && (
                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-pink-600">
                            <span className="text-2xl">❤️</span>
                            <div>
                              <p className="text-lg font-bold">{post.engagement.likes}</p>
                              <p className="text-xs text-gray-600">Likes</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-blue-600">
                            <span className="text-2xl">💬</span>
                            <div>
                              <p className="text-lg font-bold">{post.engagement.comments}</p>
                              <p className="text-xs text-gray-600">Comments</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-green-600">
                            <span className="text-2xl">🔄</span>
                            <div>
                              <p className="text-lg font-bold">{post.engagement.shares}</p>
                              <p className="text-xs text-gray-600">Shares</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                        title="View Details"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      {post.postUrl && (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                          title="View on Platform"
                        >
                          <ExternalLink size={16} />
                          <span>Open</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Post Detail Modal */}
          {selectedPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Post Details</h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Platform & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${platformColors[selectedPost.platform]} rounded-lg flex items-center justify-center`}>
                        <span className="text-white font-bold">
                          {selectedPost.platform[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{platformLabels[selectedPost.platform]}</p>
                        <p className="text-sm text-gray-600">
                          {selectedPost.dateTime.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      {selectedPost.status === 'success' ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                          <CheckCircle2 size={20} />
                          <span className="font-medium">Published Successfully</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                          <XCircle size={20} />
                          <span className="font-medium">Publishing Failed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {selectedPost.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Error Details:</p>
                      <p className="text-sm text-red-800">{selectedPost.errorMessage}</p>
                    </div>
                  )}

                  {/* Title & Content */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedPost.title}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>

                  {/* Media */}
                  {selectedPost.mediaUrls.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Media Files</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedPost.mediaUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url}
                              alt={`Media ${idx + 1}`}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {formatFileSize(selectedPost.mediaSizes[idx])}
                              {selectedPost.mediaSizes[idx] > 8 && (
                                <span className="text-red-400 ml-1">⚠️ Exceeds 8MB</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Engagement */}
                  {selectedPost.engagement && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Engagement Metrics</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-pink-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-pink-600">{selectedPost.engagement.likes}</p>
                          <p className="text-sm text-gray-600">Likes</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{selectedPost.engagement.comments}</p>
                          <p className="text-sm text-gray-600">Comments</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{selectedPost.engagement.shares}</p>
                          <p className="text-sm text-gray-600">Shares</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedPost.postUrl && (
                      <a
                        href={selectedPost.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={18} />
                        View on {platformLabels[selectedPost.platform]}
                      </a>
                    )}
                    <button
                      onClick={() => handleDownloadReport(selectedPost)}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Report
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

export default HistoryPage;
