import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor 
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });
    return Promise.reject(error);
  }
);

// Article API methods
export const articlesAPI = {
  // Get all articles with pagination and filters
  getAll: (params = {}) => {
    return api.get('/articles', { params });
  },

  // Get single article by ID
  getById: (id) => {
    return api.get(`/articles/${id}`);
  },

  // Create new article
  create: (articleData) => {
    return api.post('/articles', articleData);
  },

  // Update existing article
  update: (id, articleData) => {
    return api.put(`/articles/${id}`, articleData);
  },

  // Delete article
  delete: (id) => {
    return api.delete(`/articles/${id}`);
  },

  // Get article media
  getMedia: (id) => {
    return api.get(`/media/articles/${id}`);
  },

  // Upload media to article
  uploadMedia: (id, mediaData) => {
    return api.post(`/media/articles/${id}`, mediaData);
  },

  // Upload image directly to article (inline)
  uploadImage: (id, formData) => {
    return api.post(`/media/articles/${id}/inline`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },

  // Upload featured image
  uploadFeaturedImage: (id, formData) => {
    return api.post(`/media/articles/${id}/featured`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },

  // Upload thumbnail image
  uploadThumbnail: (id, formData) => {
    return api.post(`/media/articles/${id}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },

  // Delete media from article
  deleteMedia: (articleId, mediaId) => {
    return api.delete(`/media/articles/${articleId}/${mediaId}`);
  }
};

// Media API methods
export const mediaAPI = {
  // Upload file to Cloudinary (generic upload)
  upload: (formData) => {
    return api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }
};

// Health check
export const healthAPI = {
  check: () => {
    return api.get('/health');
  }
};

export default api;