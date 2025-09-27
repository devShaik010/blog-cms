# Postman API Testing Guide for Blogs API

## Base URL
```
http://localhost:3000
```

## 1. Health Check Endpoint

**Method:** `GET`  
**URL:** `http://localhost:3000/health`  
**Headers:** None required  
**Body:** None  

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-09-28T04:25:08.234Z"
}
```

---

## 2. Get API Documentation

**Method:** `GET`  
**URL:** `http://localhost:3000/`  
**Headers:** None required  
**Body:** None  

**Expected Response:**
```json
{
  "message": "Welcome to Blogs API",
  "version": "1.0.0",
  "endpoints": {
    "GET /health": "Health check",
    "GET /api/articles": "Get all articles",
    "GET /api/articles/:id": "Get article by ID",
    "POST /api/articles": "Create new article",
    "PUT /api/articles/:id": "Update article by ID",
    "DELETE /api/articles/:id": "Delete article by ID"
  }
}
```

---

## 3. Get All Articles

**Method:** `GET`  
**URL:** `http://localhost:3000/api/articles`  
**Headers:** None required  
**Body:** None  

**Query Parameters (Optional):**
- `page=1` - Page number (default: 1)
- `limit=10` - Items per page (default: 10)
- `author=John` - Filter by author name (partial match)
- `sortBy=created_at` - Sort by: id, title, author_name, created_at, updated_at
- `order=DESC` - Sort order: ASC or DESC

**Example URLs:**
- Basic: `http://localhost:3000/api/articles`
- With pagination: `http://localhost:3000/api/articles?page=1&limit=5`
- With filter: `http://localhost:3000/api/articles?author=John&sortBy=title&order=ASC`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Node.js",
      "description": "A comprehensive guide to building Node.js applications from scratch.",
      "author_name": "John Doe",
      "created_at": "2025-09-27T22:53:52.184Z",
      "updated_at": "2025-09-27T22:53:52.184Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 5,
    "limit": 10
  }
}
```

---

## 4. Get Article by ID

**Method:** `GET`  
**URL:** `http://localhost:3000/api/articles/{id}`  
**Headers:** None required  
**Body:** None  

**Example:** `http://localhost:3000/api/articles/1`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Getting Started with Node.js",
    "description": "A comprehensive guide to building Node.js applications from scratch.",
    "author_name": "John Doe",
    "created_at": "2025-09-27T22:53:52.184Z",
    "updated_at": "2025-09-27T22:53:52.184Z"
  }
}
```

---

## 5. Create New Article

**Method:** `POST`  
**URL:** `http://localhost:3000/api/articles`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "My New Article",
  "description": "This is a detailed description of my new article. It explains all the important concepts and provides valuable insights.",
  "author_name": "Jane Smith"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "id": 6,
    "title": "My New Article",
    "description": "This is a detailed description of my new article. It explains all the important concepts and provides valuable insights.",
    "author_name": "Jane Smith",
    "created_at": "2025-09-28T04:30:15.234Z",
    "updated_at": "2025-09-28T04:30:15.234Z"
  }
}
```

---

## 6. Update Article

**Method:** `PUT`  
**URL:** `http://localhost:3000/api/articles/{id}`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Updated Article Title",
  "description": "This is the updated description of the article with new information.",
  "author_name": "Jane Smith Updated"
}
```

**Example URL:** `http://localhost:3000/api/articles/1`

**Expected Response:**
```json
{
  "success": true,
  "message": "Article updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Article Title",
    "description": "This is the updated description of the article with new information.",
    "author_name": "Jane Smith Updated",
    "created_at": "2025-09-27T22:53:52.184Z",
    "updated_at": "2025-09-28T04:35:20.456Z"
  }
}
```

---

## 7. Delete Article

**Method:** `DELETE`  
**URL:** `http://localhost:3000/api/articles/{id}`  
**Headers:** None required  
**Body:** None  

**Example:** `http://localhost:3000/api/articles/1`

**Expected Response:**
```json
{
  "success": true,
  "message": "Article deleted successfully",
  "data": {
    "id": 1,
    "title": "Updated Article Title",
    "author_name": "Jane Smith Updated"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Bad request",
  "message": "Title, description, and author_name are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Article not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to create article"
}
```

---

## Postman Collection Setup Instructions

### Step 1: Create a New Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "Blogs API"
4. Add description: "API endpoints for blog articles management"

### Step 2: Set Collection Variables
1. In your collection, go to "Variables" tab
2. Add variable:
   - Variable: `baseUrl`
   - Initial Value: `http://localhost:3000`
   - Current Value: `http://localhost:3000`

### Step 3: Create Requests

#### For each endpoint above:
1. Click "Add Request" in your collection
2. Set the method (GET, POST, PUT, DELETE)
3. Use `{{baseUrl}}` in URLs (e.g., `{{baseUrl}}/api/articles`)
4. Add headers if required
5. Add request body for POST/PUT requests
6. Add tests (see below)

### Step 4: Add Tests to Requests

#### For successful responses, add this in "Tests" tab:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

#### For POST requests (201 status):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Article created successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("created successfully");
    pm.expect(jsonData.data).to.have.property('id');
});
```

---

## Testing Workflow

### 1. Start the Application
```bash
docker-compose up -d
```

### 2. Test Order
1. **Health Check** - Verify server is running
2. **Get All Articles** - See initial data
3. **Create Article** - Add new article
4. **Get Article by ID** - Verify creation
5. **Update Article** - Modify the article
6. **Get Article by ID** - Verify update
7. **Delete Article** - Remove the article
8. **Get Article by ID** - Verify deletion (should return 404)

### 3. Edge Cases to Test
- Create article with missing fields
- Get non-existent article (ID 999)
- Update non-existent article
- Delete non-existent article
- Create article with empty strings
- Create article with very long title (>255 chars)
- Create article with very long author name (>100 chars)

---

## Sample Test Data

### Valid Article Data:
```json
{
  "title": "Introduction to Docker",
  "description": "Learn how to containerize your applications using Docker. This comprehensive guide covers Docker basics, containers, images, and best practices for deployment.",
  "author_name": "Tech Expert"
}
```

### Invalid Article Data (for error testing):
```json
{
  "title": "",
  "description": "Missing title",
  "author_name": "Test User"
}
```

### Long Title (for validation testing):
```json
{
  "title": "This is a very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very long title that exceeds 255 characters",
  "description": "Testing title length validation",
  "author_name": "Validator"
}
```

---

## Environment Setup

Make sure your application is running on `http://localhost:3000` before testing. You can verify this by checking:
- `docker-compose ps` - Both containers should be "Up"
- `docker-compose logs app` - Should show "Server is running on port 3000"

If you need to restart the services:
```bash
docker-compose restart
```

If you need to rebuild after code changes:
```bash
docker-compose build
docker-compose up -d
```