import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import FullPageEditor from './pages/FullPageEditor';
import PreviewPage from './pages/PreviewPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Dashboard - Article List */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Full Page Editor - New Article */}
            <Route path="/editor" element={<FullPageEditor />} />
            
            {/* Full Page Editor - Edit Existing */}
            <Route path="/editor/:id" element={<FullPageEditor />} />
            
            {/* Old Editor (Legacy) */}
            <Route path="/old-editor" element={<EditorPage />} />
            <Route path="/old-editor/:id" element={<EditorPage />} />
            
            {/* Article Preview */}
            <Route path="/preview/:id" element={<PreviewPage />} />
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
