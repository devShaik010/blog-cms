import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Delimiter from '@editorjs/delimiter';
import RawTool from '@editorjs/raw';
import Embed from '@editorjs/embed';
import ImageTool from '@editorjs/image';
import { articlesAPI } from '../services/api';

// Custom image upload handler
const createImageUploadHandler = (articleId) => {
  return {
    uploadByFile: async (file) => {
      try {
        console.log('🖼️ Uploading image for article:', articleId);
        console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
        
        // If no article ID, create a temporary article first
        let currentArticleId = articleId;
        if (!currentArticleId) {
          console.log('⚠️ No article ID provided, creating temporary article...');
          const tempArticle = await articlesAPI.create({
            title: 'Untitled Article',
            author_name: 'Anonymous',
            content_json: { blocks: [] },
            status: 'draft'
          });
          currentArticleId = tempArticle.data.data.id;
          console.log('✨ Created temporary article:', currentArticleId);
        }
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('alt_text', '');
        formData.append('caption', '');
        
        console.log('📤 Uploading to API endpoint...');
        
        // Use the inline upload endpoint
        const response = await fetch(`http://localhost:3000/media/articles/${currentArticleId}/inline`, {
          method: 'POST',
          body: formData
        });
        
        console.log('📥 Upload response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Upload failed:', errorData);
          throw new Error(errorData.message || 'Upload failed');
        }
        
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        
        return {
          success: 1,
          file: {
            url: result.data.cloudinary_url,
            alt: result.data.alt_text || '',
            caption: result.data.caption || ''
          }
        };
      } catch (error) {
        console.error('❌ Image upload failed:', error);
        return {
          success: 0,
          error: error.message || 'Image upload failed'
        };
      }
    },
    
    uploadByUrl: async (url) => {
      try {
        console.log('🔗 Uploading image by URL:', url);
        
        // Validate URL
        if (!url || !url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
          throw new Error('Please provide a valid image URL (jpg, jpeg, png, gif, webp)');
        }
        
        return {
          success: 1,
          file: {
            url: url,
            alt: '',
            caption: ''
          }
        };
      } catch (error) {
        console.error('❌ URL upload failed:', error);
        return {
          success: 0,
          error: error.message || 'Failed to load image from URL'
        };
      }
    }
  };
};

// Editor.js configuration
export const createEditorConfig = (articleId, placeholder = 'Start writing your article...') => {
  return {
    holder: 'editorjs',
    placeholder: placeholder,
    autofocus: true,
    minHeight: 300,
    defaultBlock: 'paragraph',
    
    tools: {
      header: {
        class: Header,
        inlineToolbar: ['marker', 'link'],
        config: {
          levels: [1, 2, 3, 4, 5, 6],
          defaultLevel: 2,
          placeholder: 'Enter a header...',
          allowedTunes: []
        },
        shortcut: 'CMD+SHIFT+H'
      },
      
      paragraph: {
        class: Paragraph,
        inlineToolbar: true,
        config: {
          placeholder: 'Start writing or press Tab to choose a block type...',
          preserveBlank: false,
          keepBlankParagraphs: false
        }
      },
      
      list: {
        class: List,
        inlineToolbar: true,
        config: {
          defaultStyle: 'unordered'
        },
        shortcut: 'CMD+SHIFT+L'
      },
      
      quote: {
        class: Quote,
        inlineToolbar: true,
        config: {
          quotePlaceholder: 'Enter a quote...',
          captionPlaceholder: 'Quote author (optional)'
        },
        shortcut: 'CMD+SHIFT+O'
      },
      
      code: {
        class: Code,
        config: {
          placeholder: 'Enter your code here...'
        },
        shortcut: 'CMD+SHIFT+C'
      },
      
      delimiter: {
        class: Delimiter,
        shortcut: 'CMD+SHIFT+D'
      },
      
      raw: {
        class: RawTool,
        config: {
          placeholder: 'Enter raw HTML code...'
        }
      },
      
      embed: {
        class: Embed,
        config: {
          services: {
            youtube: true,
            vimeo: true,
            twitter: true,
            instagram: true,
            codepen: true
          }
        }
      },
      
      image: {
        class: ImageTool,
        config: {
          uploader: createImageUploadHandler(articleId),
          captionPlaceholder: 'Add an image caption (optional)',
          buttonContent: '📸 Upload Image',
          types: 'image/*',
          additionalRequestHeaders: {
            'Accept': 'application/json'
          },
          actions: [
            {
              name: 'new_button',
              icon: '📷',
              title: 'New Image',
              toggle: true
            }
          ]
        }
      }
    },
    
    data: {},
    
    onReady: () => {
      console.log('✅ Editor.js is ready!');
      
      // Apply proper styling after initialization
      setTimeout(() => {
        applyEditorStyling();
      }, 100);
    },
    
    onChange: (api, event) => {
      console.log('📝 Content changed:', event);
      
      // Reapply styling after content changes
      setTimeout(() => {
        applyEditorStyling();
      }, 50);
    },
    
    logLevel: 'ERROR' // Reduce console noise
  };
};

// Function to apply custom styling to Editor.js elements
const applyEditorStyling = () => {
  // Style headers with proper pixel-based sizes
  const headers = document.querySelectorAll('.ce-header');
  headers.forEach(header => {
    const level = header.getAttribute('data-level') || '2';
    header.setAttribute('data-level', level);
    
    // Apply consistent pixel-based font sizes
    switch(level) {
      case '1':
        header.style.fontSize = '32px';
        header.style.fontWeight = '700';
        header.style.margin = '32px 0 16px 0';
        header.style.lineHeight = '1.3';
        break;
      case '2':
        header.style.fontSize = '28px';
        header.style.fontWeight = '700';
        header.style.margin = '28px 0 14px 0';
        header.style.lineHeight = '1.3';
        break;
      case '3':
        header.style.fontSize = '24px';
        header.style.fontWeight = '600';
        header.style.margin = '24px 0 12px 0';
        header.style.lineHeight = '1.3';
        break;
      case '4':
        header.style.fontSize = '20px';
        header.style.fontWeight = '600';
        header.style.margin = '20px 0 10px 0';
        header.style.lineHeight = '1.3';
        break;
      case '5':
        header.style.fontSize = '18px';
        header.style.fontWeight = '600';
        header.style.margin = '18px 0 9px 0';
        header.style.lineHeight = '1.3';
        break;
      case '6':
        header.style.fontSize = '16px';
        header.style.fontWeight = '600';
        header.style.margin = '16px 0 8px 0';
        header.style.lineHeight = '1.3';
        break;
    }
  });
  
  // Fix paragraph spacing
  const paragraphs = document.querySelectorAll('.ce-paragraph');
  paragraphs.forEach(p => {
    p.style.fontSize = '16px';
    p.style.lineHeight = '1.6';
    p.style.color = '#374151';
    p.style.margin = '12px 0';
    p.style.padding = '0';
  });
  
  // Fix block spacing
  const blocks = document.querySelectorAll('.ce-block');
  blocks.forEach(block => {
    block.style.margin = '8px 0';
  });
  
  // Style the editor container
  const editor = document.querySelector('.codex-editor');
  if (editor) {
    editor.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    editor.style.fontSize = '16px';
    editor.style.lineHeight = '1.6';
  }
  
  console.log('🎨 Editor styling applied with pixel-based fonts');
};

// Helper functions for Editor.js data
export const editorHelpers = {
  // Convert Editor.js blocks to plain text
  blocksToText: (blocks) => {
    if (!blocks || !Array.isArray(blocks)) return '';
    
    return blocks
      .map(block => {
        switch (block.type) {
          case 'paragraph':
          case 'header':
            return block.data.text || '';
          case 'list':
            return block.data.items ? block.data.items.join(' ') : '';
          case 'quote':
            return block.data.text || '';
          case 'code':
            return block.data.code || '';
          default:
            return '';
        }
      })
      .join(' ')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  },
  
  // Generate excerpt from blocks
  generateExcerpt: (blocks, maxLength = 160) => {
    const text = editorHelpers.blocksToText(blocks);
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;
  },
  
  // Count words in blocks
  countWords: (blocks) => {
    const text = editorHelpers.blocksToText(blocks);
    return text.split(/\s+/).filter(word => word.length > 0).length;
  },
  
  // Calculate reading time (average 225 words per minute)
  calculateReadingTime: (blocks) => {
    const wordCount = editorHelpers.countWords(blocks);
    return Math.max(1, Math.ceil(wordCount / 225));
  },
  
  // Validate Editor.js data
  validateEditorData: (data) => {
    if (!data || typeof data !== 'object') return false;
    if (!data.blocks || !Array.isArray(data.blocks)) return false;
    
    // Check if at least one block has content
    return data.blocks.some(block => {
      if (block.type === 'paragraph' || block.type === 'header') {
        return block.data && block.data.text && block.data.text.trim().length > 0;
      }
      return true; // Other block types are considered valid
    });
  }
};

export default EditorJS;