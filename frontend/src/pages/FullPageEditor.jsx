import React, { useState, useEffect } from 'react';
import TipTapEditor from '../components/Editor/TipTapEditor';
import { articlesAPI } from '../services/api';
import { Save, Eye, Settings, Menu, X, Upload, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const FullPageEditor = () => {
  const navigate = useNavigate();
  const { id: articleId } = useParams();
  
  // Editor state
  const [content, setContent] = useState('<h1>Your Article Title</h1><p>Start writing your content here...</p>');
  const [title, setTitle] = useState('');
  const [currentArticleId, setCurrentArticleId] = useState(articleId);
  
  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Article settings
  const [articleSettings, setArticleSettings] = useState({
    title: '',
    author_name: 'Anonymous',
    excerpt: '',
    tags: '',
    category: '',
    featured_image: '',
    status: 'draft'
  });

  // Local storage key for drafts
  const getDraftKey = () => currentArticleId ? `article_draft_${currentArticleId}` : 'article_draft_new';

  // Load existing article if editing
  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    } else {
      // Load from localStorage for new articles
      loadDraftFromStorage();
    }
  }, [articleId]);

  const loadArticle = async (id) => {
    try {
      const response = await articlesAPI.getById(id);
      const article = response.data.data;
      
      setContent(article.content_html || article.content_json?.html || '');
      setTitle(article.title || '');
      setArticleSettings({
        title: article.title || '',
        author_name: article.author_name || 'Anonymous',
        excerpt: article.excerpt || '',
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
        category: article.category_id || '',
        featured_image: article.featured_image_url || '',
        status: article.status || 'draft'
      });
      updateStats(article.content_html || '');
    } catch (error) {
      console.error('Failed to load article:', error);
      setError('Failed to load article');
      loadDraftFromStorage(); // Fallback to draft
    }
  };

  const loadDraftFromStorage = () => {
    try {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setContent(draft.content || '<h1>Your Article Title</h1><p>Start writing...</p>');
        setArticleSettings(draft.settings || articleSettings);
        updateStats(draft.content || '');
        setLastSaved(new Date(draft.savedAt));
        console.log('📄 Loaded draft from local storage');
      }
    } catch (error) {
      console.error('Failed to load draft from storage:', error);
    }
  };

  // Handle content changes
  const handleContentChange = ({ html, json }) => {
    setContent(html);
    updateStats(html);
    setError(null);
    setSuccess(null);
    
    // Auto-save to localStorage after 2 seconds
    setTimeout(() => saveDraftToStorage(html), 2000);
  };

  // Update statistics
  const updateStats = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim().split(/\\s+/).filter(word => word.length > 0).length;
    const reading = Math.max(1, Math.ceil(words / 200));
    
    setWordCount(words);
    setReadingTime(reading);

    // Extract title from content if not set
    const firstHeading = tempDiv.querySelector('h1, h2, h3');
    if (firstHeading && firstHeading.textContent.trim() && !articleSettings.title) {
      const extractedTitle = firstHeading.textContent.trim();
      setTitle(extractedTitle);
      setArticleSettings(prev => ({ ...prev, title: extractedTitle }));
    }
  };

  // Save draft to localStorage
  const saveDraftToStorage = (htmlContent = content) => {
    try {
      const draftKey = getDraftKey();
      const draftData = {
        content: htmlContent,
        settings: articleSettings,
        savedAt: new Date().toISOString(),
        wordCount,
        readingTime
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      console.log('💾 Draft saved to local storage');
    } catch (error) {
      console.error('Failed to save draft to storage:', error);
    }
  };

  // Save draft (localStorage only)
  const handleSaveDraft = async () => {
    if (!content.trim()) {
      setError('Please add some content before saving');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      saveDraftToStorage();
      setSuccess('Draft saved locally');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish article (save to database)
  const handlePublish = async () => {
    if (!content.trim()) {
      setError('Please add some content before publishing');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // Ensure we have a title
      let finalTitle = articleSettings.title || title;
      if (!finalTitle) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const firstHeading = tempDiv.querySelector('h1, h2, h3');
        finalTitle = firstHeading ? firstHeading.textContent.trim() : 'Untitled Article';
      }

      // Parse tags
      let parsedTags = [];
      if (typeof articleSettings.tags === 'string') {
        parsedTags = articleSettings.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      // Create simplified article data matching the backend exactly
      const articleData = {
        title: finalTitle,
        author_name: articleSettings.author_name || 'Anonymous',
        content: { 
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
        },
        status: 'published',
        excerpt: articleSettings.excerpt || '',
        tags: parsedTags,
        featured_image_url: articleSettings.featured_image || null
      };

      console.log('🚀 Publishing article with data:', articleData);

      let response;
      if (currentArticleId) {
        response = await articlesAPI.update(currentArticleId, { ...articleData, status: 'published' });
      } else {
        response = await articlesAPI.create(articleData);
        const newArticleId = response.data.data.id;
        setCurrentArticleId(newArticleId);
        
        // Clear the draft from localStorage since it's now published
        localStorage.removeItem('article_draft_new');
        
        navigate(`/editor/${newArticleId}`, { replace: true });
      }

      setSuccess('Article published successfully!');
      console.log('✅ Article published successfully');
      
    } catch (error) {
      console.error('❌ Publish failed:', error);
      console.error('Error response:', error.response?.data);
      setError(`Publish failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    if (currentArticleId) {
      window.open(`/preview/${currentArticleId}`, '_blank');
    } else {
      // Create a temporary preview from current content
      const previewWindow = window.open('', '_blank');
      previewWindow.document.write(`
        <html>
          <head>
            <title>Preview - ${articleSettings.title || 'Article Preview'}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1, h2, h3 { color: #333; }
              p { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>Preview</h1>
            <div>${content}</div>
            <hr>
            <p><small>Author: ${articleSettings.author_name} | Reading Time: ${readingTime} min</small></p>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-sm text-gray-500">
            {wordCount} words • {readingTime} min read
          </div>
          {lastSaved && (
            <div className="text-sm text-gray-400">
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <span>✅</span>
              {success}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Article Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={handlePreview}
            disabled={!currentArticleId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto px-8 py-6">
          <TipTapEditor
            content={content}
            onChange={handleContentChange}
            articleId={currentArticleId}
            placeholder="Start writing your amazing article..."
          />
        </div>
      </div>

      {/* Settings Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div 
            className="flex-1"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="w-96 bg-white h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Article Settings</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={articleSettings.title}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter article title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={articleSettings.author_name}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, author_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Author name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={articleSettings.excerpt}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the article..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={articleSettings.tags}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={articleSettings.category}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Article category..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={articleSettings.featured_image}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, featured_image: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={articleSettings.status}
                    onChange={(e) => setArticleSettings(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => {
                    saveDraftToStorage();
                    setSuccess('Settings saved locally');
                    setTimeout(() => setSuccess(null), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Settings (Local)
                </button>
                
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    handlePublish();
                  }}
                  disabled={isPublishing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Publish Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullPageEditor;