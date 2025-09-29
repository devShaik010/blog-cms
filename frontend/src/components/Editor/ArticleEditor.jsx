import React, { useEffect, useRef, useState } from 'react';
import TipTapEditor from './TipTapEditor';
import { articlesAPI } from '../../services/api';
import { Save, Eye, Upload, AlertCircle } from 'lucide-react';

const ArticleEditor = ({ 
  articleId = null, 
  initialData = null, 
  onSave = () => {}, 
  onPublish = () => {},
  onArticleCreated = () => {},
  className = '' 
}) => {
  const [isReady, setIsReady] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(1);
  const [error, setError] = useState(null);
  const [currentArticleId, setCurrentArticleId] = useState(articleId);
  const [content, setContent] = useState(initialData?.html || '<h1>Your Article Title</h1><p>Start writing your content here...</p>');
  const [title, setTitle] = useState(initialData?.title || '');

  // Initialize stats on component mount
  useEffect(() => {
    updateStats(content);
  }, []);

  // Handle content changes
  const handleContentChange = ({ html, json }) => {
    setContent(html);
    updateStats(html);
    setError(null);
    
    // Auto-save after 3 seconds of inactivity
    setTimeout(() => {
      if (!isSaving) {
        handleAutoSave(html, json);
      }
    }, 3000);
  };

  // Update word count and reading time
  const updateStats = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const reading = Math.max(1, Math.ceil(words / 200)); // Assume 200 words per minute
    
    setWordCount(words);
    setReadingTime(reading);
  };

  // Auto-save functionality
  const handleAutoSave = async (html, json) => {
    if (!currentArticleId || isSaving) return;
    
    try {
      console.log('💾 Auto-saving...');
      await articlesAPI.update(currentArticleId, {
        content_html: html,
        content_json: json,
        reading_time: readingTime
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Save article
  const handleSave = async (status = 'draft', providedData = {}) => {
    if (!content.trim()) {
      setError('Please add some content before saving');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log('💾 Saving article with status:', status);
      
      // Extract title from content or use provided data
      let articleTitle = providedData.title || title || 'Untitled Article';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const firstHeading = tempDiv.querySelector('h1, h2, h3');
      if (firstHeading && firstHeading.textContent.trim()) {
        articleTitle = firstHeading.textContent.trim();
      }

      const articleData = {
        title: articleTitle,
        author_name: providedData.author_name || 'Anonymous',
        content_html: content,
        content_json: { html: content }, // Simple JSON format for TipTap
        status: status,
        reading_time: readingTime,
        ...providedData
      };

      console.log('📤 Sending article data:', articleData);

      let response;
      if (currentArticleId) {
        console.log('📝 Updating existing article:', currentArticleId);
        response = await articlesAPI.update(currentArticleId, articleData);
      } else {
        console.log('✨ Creating new article');
        response = await articlesAPI.create(articleData);
        const newArticleId = response.data.data.id;
        setCurrentArticleId(newArticleId);
        onArticleCreated(newArticleId);
        console.log('✅ Article created with ID:', newArticleId);
      }

      setLastSaved(new Date());
      onSave(response.data.data);
      console.log('✅ Article saved successfully');
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish article
  const handlePublish = (providedData = {}) => {
    handleSave('published', providedData).then(() => {
      onPublish();
    }).catch((error) => {
      console.error('Publish failed:', error);
    });
  };

  // Get editor data
  const getEditorData = () => {
    return {
      html: content,
      json: { html: content }
    };
  };

  // Expose methods to parent
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    getEditorData,
    save: (data) => handleSave('draft', data),
    publish: (data) => handlePublish(data),
    getCurrentArticleId: () => currentArticleId
  }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {wordCount} words • {readingTime} min read
          </div>
          {lastSaved && (
            <div className="text-sm text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
          
          <button
            onClick={() => handleSave('draft')}
            disabled={!isReady || isSaving}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          
          <button
            onClick={() => handlePublish()}
            disabled={!isReady || isSaving}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isSaving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
          <TipTapEditor
            content={content}
            onChange={handleContentChange}
            articleId={currentArticleId}
            placeholder="Start writing your amazing article..."
          />
          
          {!isReady && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading editor...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;