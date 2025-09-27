const { query } = require('../config/database');

class ArticleController {
  // GET /api/articles - Get all articles
  async getAllArticles(req, res) {
    try {
      const { page = 1, limit = 10, author, sortBy = 'created_at', order = 'DESC' } = req.query;
      const offset = (page - 1) * limit;
      
      let queryText = `
        SELECT id, title, description, author_name, created_at, updated_at 
        FROM articles
      `;
      let queryParams = [];
      let paramIndex = 1;
      
      // Add author filter if provided
      if (author) {
        queryText += ` WHERE author_name ILIKE $${paramIndex}`;
        queryParams.push(`%${author}%`);
        paramIndex++;
      }
      
      // Add sorting
      const validSortColumns = ['id', 'title', 'author_name', 'created_at', 'updated_at'];
      const validOrders = ['ASC', 'DESC'];
      
      if (validSortColumns.includes(sortBy) && validOrders.includes(order.toUpperCase())) {
        queryText += ` ORDER BY ${sortBy} ${order.toUpperCase()}`;
      } else {
        queryText += ` ORDER BY created_at DESC`;
      }
      
      // Add pagination
      queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      const result = await query(queryText, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM articles';
      let countParams = [];
      
      if (author) {
        countQuery += ' WHERE author_name ILIKE $1';
        countParams.push(`%${author}%`);
      }
      
      const countResult = await query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch articles'
      });
    }
  }

  // GET /api/articles/:id - Get article by ID
  async getArticleById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Valid article ID is required'
        });
      }
      
      const result = await query(
        'SELECT id, title, description, author_name, created_at, updated_at FROM articles WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Article not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch article'
      });
    }
  }

  // POST /api/articles - Create new article
  async createArticle(req, res) {
    try {
      const { title, description, author_name } = req.body;
      
      // Validation
      if (!title || !description || !author_name) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Title, description, and author_name are required'
        });
      }
      
      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Title must be 255 characters or less'
        });
      }
      
      if (author_name.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Author name must be 100 characters or less'
        });
      }
      
      const result = await query(
        `INSERT INTO articles (title, description, author_name) 
         VALUES ($1, $2, $3) 
         RETURNING id, title, description, author_name, created_at, updated_at`,
        [title.trim(), description.trim(), author_name.trim()]
      );
      
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create article'
      });
    }
  }

  // PUT /api/articles/:id - Update article by ID
  async updateArticle(req, res) {
    try {
      const { id } = req.params;
      const { title, description, author_name } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Valid article ID is required'
        });
      }
      
      // Check if article exists
      const existingArticle = await query('SELECT id FROM articles WHERE id = $1', [id]);
      if (existingArticle.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Article not found'
        });
      }
      
      // Validation
      if (!title || !description || !author_name) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Title, description, and author_name are required'
        });
      }
      
      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Title must be 255 characters or less'
        });
      }
      
      if (author_name.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Author name must be 100 characters or less'
        });
      }
      
      const result = await query(
        `UPDATE articles 
         SET title = $1, description = $2, author_name = $3, updated_at = NOW() 
         WHERE id = $4 
         RETURNING id, title, description, author_name, created_at, updated_at`,
        [title.trim(), description.trim(), author_name.trim(), id]
      );
      
      res.json({
        success: true,
        message: 'Article updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update article'
      });
    }
  }

  // DELETE /api/articles/:id - Delete article by ID
  async deleteArticle(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Valid article ID is required'
        });
      }
      
      const result = await query(
        'DELETE FROM articles WHERE id = $1 RETURNING id, title, author_name',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Article not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Article deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete article'
      });
    }
  }
}

module.exports = new ArticleController();