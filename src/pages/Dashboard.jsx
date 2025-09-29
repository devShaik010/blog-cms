import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ArticleList from '../components/Articles/ArticleList';
import { articlesAPI } from '../services/api';
import { FileText, TrendingUp, Eye, Edit, Plus } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Fetch articles with current filters
  const { data: articlesResponse, isLoading, error } = useQuery({
    queryKey: ['articles', filters],
    queryFn: () => articlesAPI.getAll({
      page: filters.page,
      limit: filters.limit,
      status: filters.status === 'all' ? '' : filters.status,
      sortBy: filters.sortBy,
      order: filters.sortOrder.toUpperCase()
    }),
    keepPreviousData: true
  });

  const articles = articlesResponse?.data?.data?.articles || [];
  const pagination = articlesResponse?.data?.data?.pagination || {};

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: (articleId) => articlesAPI.delete(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['articles']);
    }
  });

  // Calculate dashboard stats
  const stats = React.useMemo(() => {
    if (!articles.length) {
      return {
        total: 0,
        published: 0,
        drafts: 0,
        totalViews: 0
      };
    }

    return {
      total: pagination.totalCount || articles.length,
      published: articles.filter(a => a.status === 'published').length,
      drafts: articles.filter(a => a.status === 'draft').length,
      totalViews: articles.reduce((sum, a) => sum + (a.view_count || 0), 0)
    };
  }, [articles, pagination]);

  const handleCreateArticle = () => {
    navigate('/editor');
  };

  const handleEditArticle = (article) => {
    navigate(`/editor/${article.id}`);
  };

  const handleViewArticle = (article) => {
    window.open(`/preview/${article.id}`, '_blank');
  };

  const handleDeleteArticle = (article) => {
    if (window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
      deleteArticleMutation.mutate(article.id);
    }
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSearch = (searchFilters) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      search: searchFilters.search || '',
      status: searchFilters.status || '',
      sortBy: searchFilters.sortBy || 'created_at',
      sortOrder: searchFilters.sortOrder || 'desc'
    }));
  };

  const handleFilter = (filterOptions) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      ...filterOptions
    }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Failed to load articles</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Blog CMS</h1>
            </div>
            
            <button
              onClick={handleCreateArticle}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total Articles</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Published</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.published}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Edit className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Drafts</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.drafts}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total Views</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <ArticleList
          articles={articles}
          loading={isLoading}
          pagination={pagination}
          onEdit={handleEditArticle}
          onDelete={handleDeleteArticle}
          onView={handleViewArticle}
          onCreate={handleCreateArticle}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onFilter={handleFilter}
        />
      </div>
    </div>
  );
};

export default Dashboard;