-- Initialize the database with the articles table
-- This script runs automatically when the PostgreSQL container starts

CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_name);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);

-- Insert some sample data
INSERT INTO articles (title, description, author_name) VALUES
('Getting Started with Node.js', 'A comprehensive guide to building Node.js applications from scratch.', 'John Doe'),
('PostgreSQL Best Practices', 'Learn the best practices for designing and optimizing PostgreSQL databases.', 'Jane Smith'),
('Docker for Developers', 'Understanding Docker containers and how to use them in development workflows.', 'Mike Johnson'),
('RESTful API Design', 'Principles and best practices for designing RESTful APIs that scale.', 'Sarah Wilson'),
('Express.js Middleware', 'Deep dive into Express.js middleware and how to create custom middleware functions.', 'John Doe');

-- Display confirmation message
\echo 'Database initialized successfully with sample data!';