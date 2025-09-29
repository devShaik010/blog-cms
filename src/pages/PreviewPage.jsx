import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesAPI } from '../services/api';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';

const PreviewPage = () => {
  const { id } = useParams();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article-preview', id],
    queryFn: () => articlesAPI.getById(id, 'html'),
    select: (response) => response.data.data
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading article...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Article not found</div>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render Editor.js blocks as HTML
  const renderContent = () => {
    if (article.content_html) {
      return <div dangerouslySetInnerHTML={{ __html: article.content_html }} />;
    }

    if (article.content_json && article.content_json.blocks) {
      return (
        <div className="prose prose-lg max-w-none">
          {article.content_json.blocks.map((block, index) => {
            switch (block.type) {
              case 'header':
                const HeaderTag = `h${block.data.level || 2}`;
                return (
                  <HeaderTag key={index} dangerouslySetInnerHTML={{ __html: block.data.text }} />
                );
              
              case 'paragraph':
                return (
                  <p key={index} dangerouslySetInnerHTML={{ __html: block.data.text }} />
                );
              
              case 'list':
                const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                return (
                  <ListTag key={index}>
                    {block.data.items.map((item, itemIndex) => (
                      <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ListTag>
                );
              
              case 'quote':
                return (
                  <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic">
                    <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                    {block.data.caption && (
                      <cite className="text-sm text-gray-600">— {block.data.caption}</cite>
                    )}
                  </blockquote>
                );
              
              case 'code':
                return (
                  <pre key={index} className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                    <code>{block.data.code}</code>
                  </pre>
                );
              
              case 'delimiter':
                return <hr key={index} className="my-8" />;
              
              case 'image':
                return (
                  <figure key={index} className="my-8">
                    <img
                      src={block.data.file?.url || block.data.url}
                      alt={block.data.caption || ''}
                      className="w-full rounded-lg"
                    />
                    {block.data.caption && (
                      <figcaption className="text-center text-sm text-gray-600 mt-2">
                        {block.data.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              
              case 'embed':
                return (
                  <div key={index} className="my-8">
                    <div dangerouslySetInnerHTML={{ __html: block.data.embed }} />
                    {block.data.caption && (
                      <p className="text-center text-sm text-gray-600 mt-2">
                        {block.data.caption}
                      </p>
                    )}
                  </div>
                );
              
              default:
                return null;
            }
          })}
        </div>
      );
    }

    return <p className="text-gray-500">No content available</p>;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.close()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Close Preview
          </button>
          
          <div className="text-center">
            <div className="text-sm text-blue-600 font-medium mb-2">
              {article.status === 'published' ? 'Published Article' : 'Draft Preview'}
            </div>
            
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex justify-center space-x-2 mb-4">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            
            {article.subtitle && (
              <p className="text-xl text-gray-600 mb-6">{article.subtitle}</p>
            )}
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {article.author_name}
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(article.created_at)}
              </div>
              
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {article.reading_time || 1} min read
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {article.featured_image_url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="prose prose-lg max-w-none">
          {article.excerpt && (
            <p className="text-xl text-gray-600 font-medium mb-8 not-prose">
              {article.excerpt}
            </p>
          )}
          
          {renderContent()}
        </article>
        
        {/* Article Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Article ID: {article.id} • 
              {article.view_count ? ` ${article.view_count} views` : ' No views yet'}
            </div>
            
            <div>
              Last updated: {formatDate(article.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;