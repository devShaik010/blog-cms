import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import FileHandler from '@tiptap/extension-file-handler'
import DropCursor from '@tiptap/extension-dropcursor'
import GapCursor from '@tiptap/extension-gapcursor'
import { useState, useCallback, useRef } from 'react'
import './TipTapEditor.css'

const TipTapEditor = ({ content, onChange, articleId, placeholder = "Start writing your article..." }) => {
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // Disable built-in link and underline to avoid duplicates
        link: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-image max-w-full h-auto rounded-lg shadow-sm my-4',
          style: 'display: block; margin: 1rem auto; max-width: 100%; height: auto;',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Subscript,
      Superscript,
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(file => {
            if (file.type.startsWith('image/')) {
              handleFileUpload(file, currentEditor, pos);
            }
          });
        },
        onPaste: (currentEditor, files) => {
          files.forEach(file => {
            if (file.type.startsWith('image/')) {
              handleFileUpload(file, currentEditor);
            }
          });
        },
      }),
      DropCursor.configure({
        color: '#3b82f6',
        width: 3,
      }),
      GapCursor,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const json = editor.getJSON()
      onChange && onChange({ html, json })
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-lg max-w-none focus:outline-none px-6 py-4',
        spellcheck: 'false',
      },
      handleDrop: (view, event, slice, moved) => {
        // Enhanced drop handling
        return false; // Let FileHandler handle it
      },
      handlePaste: (view, event, slice) => {
        // Enhanced paste handling
        return false; // Let FileHandler handle it
      },
    },
  })

  // File upload handler for drag/drop and paste
  const handleFileUpload = useCallback(async (file, currentEditor, pos) => {
    if (!articleId) {
      console.error('❌ No article ID provided for image upload')
      alert('Please save the article first before uploading images.')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      console.log('📤 Uploading image for article:', articleId)
      
      const response = await fetch(`http://localhost:3000/media/articles/${articleId}/inline`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorData}`)
      }
      
      const result = await response.json()
      console.log('✅ Image uploaded successfully:', result)
      
      // Insert image into editor
      if (result.data?.url && currentEditor) {
        const imageAttrs = { 
          src: result.data.url, 
          alt: file.name,
          title: file.name 
        }
        
        if (pos !== undefined) {
          currentEditor.chain().insertContentAt(pos, {
            type: 'image',
            attrs: imageAttrs
          }).run()
        } else {
          currentEditor.chain().focus().setImage(imageAttrs).run()
        }
      }
      
    } catch (error) {
      console.error('❌ Image upload failed:', error)
      alert(`Failed to upload image: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }, [articleId])

  // Button-triggered image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!articleId) {
      alert('Please save the article first before uploading images.')
      return null
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      console.log('📤 Uploading image for article:', articleId)
      
      const response = await fetch(`http://localhost:3000/media/articles/${articleId}/inline`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorData}`)
      }
      
      const result = await response.json()
      console.log('✅ Image uploaded successfully:', result)
      
      return result.data?.url
    } catch (error) {
      console.error('❌ Image upload failed:', error)
      alert(`Failed to upload image: ${error.message}`)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [articleId])

  // Handle file input from button
  const onImageInputChange = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (file && editor) {
      const url = await handleImageUpload(file)
      if (url) {
        editor.chain().focus().setImage({ 
          src: url, 
          alt: file.name,
          title: file.name 
        }).run()
      }
    }
    // Clear the input
    event.target.value = ''
  }, [editor, handleImageUpload])

  if (!editor) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
  }

  return (
    <div className="tiptap-container bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full relative">
      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className="absolute top-0 left-0 right-0 bg-blue-50 border-b border-blue-200 px-4 py-2 z-20">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium">Uploading image to Cloudinary...</span>
          </div>
        </div>
      )}
      
      {/* Professional Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 flex-wrap sticky top-0 z-10">
        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Heading Dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? 1 :
              editor.isActive('heading', { level: 2 }) ? 2 :
              editor.isActive('heading', { level: 3 }) ? 3 :
              editor.isActive('heading', { level: 4 }) ? 4 :
              editor.isActive('heading', { level: 5 }) ? 5 :
              editor.isActive('heading', { level: 6 }) ? 6 : 0
            }
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value={0}>Normal</option>
            <option value={1}>Heading 1</option>
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
            <option value={4}>Heading 4</option>
            <option value={5}>Heading 5</option>
            <option value={6}>Heading 6</option>
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors font-bold ${
            editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors italic ${
            editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded transition-colors underline ${
            editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Underline"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded transition-colors line-through ${
            editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Strikethrough"
        >
          S
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Text Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm-4 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Justify"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Advanced Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-2 rounded transition-colors text-xs ${
            editor.isActive('subscript') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Subscript"
        >
          X₂
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-2 rounded transition-colors text-xs ${
            editor.isActive('superscript') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Superscript"
        >
          X²
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Code and Quote */}
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded transition-colors font-mono text-sm ${
            editor.isActive('code') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Inline Code"
        >
          &lt;/&gt;
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded transition-colors ${
            editor.isActive('link') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Image Upload */}
        <label className={`p-2 rounded transition-colors cursor-pointer ${
          isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
        }`} title="Insert Image">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={onImageInputChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Add Button */}
        <button
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Add"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <EditorContent 
            editor={editor} 
            className="min-h-[70vh] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 rounded-lg transition-all duration-200" 
          />
          
          {/* Drop Zone Hint */}
          {!isUploading && editor?.isEmpty && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="text-center text-gray-400 space-y-4">
                <div className="text-6xl">📝</div>
                <div>
                  <p className="text-lg font-medium">Start writing your article...</p>
                  <p className="text-sm">You can drag & drop images directly into the editor</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Upload Status */}
        {isUploading && (
          <div className="fixed bottom-4 right-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Uploading image...</span>
            </div>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Uploading image...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TipTapEditor