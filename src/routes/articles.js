const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// GET /api/articles - Get all articles
router.get('/', articleController.getAllArticles);

// GET /api/articles/:id - Get article by ID
router.get('/:id', articleController.getArticleById);

// POST /api/articles - Create new article
router.post('/', articleController.createArticle);

// PUT /api/articles/:id - Update article by ID
router.put('/:id', articleController.updateArticle);

// DELETE /api/articles/:id - Delete article by ID
router.delete('/:id', articleController.deleteArticle);

module.exports = router;