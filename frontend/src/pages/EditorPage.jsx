import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ArticleEditor from '../components/Editor/ArticleEditor';
import { articlesAPI } from '../services/api';
import { ArrowLeft, Settings, Eye } from 'lucide-react';

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  
  const [articleData, setArticleData] = useState({
    title: '',
    subtitle: '',
    author_name: 'Anonymous',
    excerpt: '',
    tags: [],
    meta_title: '',
    meta_description: '',
    status: 'draft'
  });

  // Fetch article if editing
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesAPI.getById(id),
    enabled: isEdit,
    select: (response) => response.data.data
  });

  // Update article data when article is loaded
  useEffect(() => {
    if (article) {
      setArticleData({
        title: article.title || '',
        subtitle: article.subtitle || '',
        author_name: article.author_name || 'Anonymous',
        excerpt: article.excerpt || '',
        tags: article.tags || [],
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        status: article.status || 'draft'
      });
    }
  }, [article]);

  // Save article mutation
  const saveArticleMutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return articlesAPI.update(id, data);
      } else {
        return articlesAPI.create(data);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['articles']);
      if (!isEdit) {
        // Navigate to edit mode for new articles
        navigate(`/editor/${response.data.data.id}`, { replace: true });
      }
    }
  });

  const handleSave = (savedArticle) => {
    console.log('✅ Article saved:', savedArticle);
    queryClient.invalidateQueries(['articles']);
    
    // Update local state with saved data
    if (savedArticle) {
      setArticleData(prev => ({
        ...prev,
        title: savedArticle.title || prev.title,
        author_name: savedArticle.author_name || prev.author_name,
        status: savedArticle.status || prev.status
      }));
    }
  };

  const handlePublish = () => {
    console.log('🚀 Publishing article...');
  };

  const handleArticleCreated = (newArticleId) => {
    console.log('✨ New article created with ID:', newArticleId);
    // Navigate to the new article's edit page
    navigate(`/editor/${newArticleId}`, { replace: true });
  };

  const handleInputChange = (field, value) => {
    setArticleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (tagsString) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setArticleData(prev => ({
      ...prev,
      tags
    }));
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading article...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Articles
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {isEdit ? 'Editing Article' : 'New Article'}
              </span>
              {isEdit && (
                <button
                  onClick={() => window.open(`/preview/${id}`, '_blank')}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Article Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Article Settings</h3>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={articleData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter article title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={articleData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Enter subtitle..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={articleData.author_name}
                  onChange={(e) => handleInputChange('author_name', e.target.value)}
                  placeholder="Enter author name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={articleData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={articleData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Brief description of the article..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* SEO Settings */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">SEO Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={articleData.meta_title}
                      onChange={(e) => handleInputChange('meta_title', e.target.value)}
                      placeholder="SEO title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={articleData.meta_description}
                      onChange={(e) => handleInputChange('meta_description', e.target.value)}
                      placeholder="SEO description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={articleData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ArticleEditor
                articleId={id}
                initialData={article?.content_json}
                onSave={handleSave}
                onPublish={handlePublish}
                onArticleCreated={handleArticleCreated}
                className="h-screen lg:h-[calc(100vh-12rem)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;