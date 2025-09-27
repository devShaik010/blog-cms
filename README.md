# Blogs API - Node.js Express Application

A RESTful API for managing articles built with Node.js, Express.js, and PostgreSQL.

## Features

- ✅ Full CRUD operations for articles
- ✅ PostgreSQL database with Docker
- ✅ Input validation and error handling
- ✅ Pagination and filtering
- ✅ Health check endpoint
- ✅ Security middleware (Helmet, CORS)
- ✅ Request logging with Morgan
- ✅ Docker containerization

## Article Schema

```json
{
  "id": "integer (auto-generated)",
  "title": "string (max 255 characters)",
  "description": "text",
  "author_name": "string (max 100 characters)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/health` | Health check | - |
| GET | `/` | API documentation | - |
| GET | `/api/articles` | Get all articles | - |
| GET | `/api/articles/:id` | Get article by ID | - |
| POST | `/api/articles` | Create new article | `{ title, description, author_name }` |
| PUT | `/api/articles/:id` | Update article | `{ title, description, author_name }` |
| DELETE | `/api/articles/:id` | Delete article | - |

### Query Parameters for GET /api/articles

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `author` - Filter by author name (partial match)
- `sortBy` - Sort by field: id, title, author_name, created_at, updated_at (default: created_at)
- `order` - Sort order: ASC, DESC (default: DESC)

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd blogs-foxicon
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start with Docker Compose

```bash
# Start both database and application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Start Development Mode (Local)

```bash
# Start PostgreSQL with Docker
docker-compose up -d db

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Usage Examples

### Create Article

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Article",
    "description": "This is a detailed description of my first article.",
    "author_name": "John Doe"
  }'
```

### Get All Articles

```bash
curl http://localhost:3000/api/articles
```

### Get Articles with Pagination and Filtering

```bash
curl "http://localhost:3000/api/articles?page=1&limit=5&author=John&sortBy=created_at&order=DESC"
```

### Get Article by ID

```bash
curl http://localhost:3000/api/articles/1
```

### Update Article

```bash
curl -X PUT http://localhost:3000/api/articles/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Article Title",
    "description": "Updated description",
    "author_name": "John Doe"
  }'
```

### Delete Article

```bash
curl -X DELETE http://localhost:3000/api/articles/1
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... } // Only for GET /api/articles
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f db

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose build app
```

## Development

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blogs_db
DB_USER=postgres
DB_PASS=password123
DATABASE_URL=postgresql://postgres:password123@db:5432/blogs_db
```

### Database Connection

The application automatically:
- Creates the database connection pool
- Initializes tables on startup
- Handles connection errors gracefully

### Testing

```bash
# Health check
curl http://localhost:3000/health

# API documentation
curl http://localhost:3000/
```

## Project Structure

```
blogs-foxicon/
├── src/
│   ├── app.js                 # Main application file
│   ├── config/
│   │   └── database.js        # Database configuration
│   ├── controllers/
│   │   └── articleController.js # Article CRUD operations
│   └── routes/
│       └── articles.js        # Article routes
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Application container
├── init.sql                   # Database initialization
├── healthcheck.js            # Container health check
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use secure database credentials
3. Configure proper SSL/TLS
4. Set up monitoring and logging
5. Use a reverse proxy (nginx)
6. Configure auto-restart policies

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Connect to database directly
docker-compose exec db psql -U postgres -d blogs_db
```

### Application Issues

```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app
```

## License

MIT License