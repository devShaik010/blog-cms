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
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
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
          setIsDragActive(false)
          files.forEach(file => {
            if (file.type.startsWith('image/')) {
              uploadImage(file, currentEditor, pos)
            }
          })
        },
        onPaste: (currentEditor, files) => {
          files.forEach(file => {
            if (file.type.startsWith('image/')) {
              uploadImage(file, currentEditor)
            }
          })
        },
      }),
      DropCursor.configure({
        color: '#3b82f6',
        width: 2,
      }),
      GapCursor,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const json = editor.getJSON()
      onChange?.({ html, json })
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6',
        spellcheck: 'true',
      },
      handleDOMEvents: {
        dragenter: () => {
          setIsDragActive(true)
          return false
        },
        dragleave: (view, event) => {
          if (!event.relatedTarget || !view.dom.contains(event.relatedTarget)) {
            setIsDragActive(false)
          }
          return false
        },
        drop: () => {
          setIsDragActive(false)
          return false
        },
      },
    },
  })

  const uploadImage = useCallback(async (file, currentEditor, pos) => {
    if (!articleId) {
      alert('Please save the article first before uploading images.')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch(`http://localhost:3000/media/articles/${articleId}/inline`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorData}`)
      }
      
      const result = await response.json()
      
      if (result.data?.url && currentEditor) {
        const imageAttrs = { 
          src: result.data.url, 
          alt: file.name,
          title: file.name,
          loading: 'lazy'
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

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files?.[0]
    if (file && editor) {
      uploadImage(file, editor)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [editor, uploadImage])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="editor-skeleton">
        <div className="skeleton-toolbar"></div>
        <div className="skeleton-content"></div>
      </div>
    )
  }

  return (
    <div className="tiptap-editor-container">
      {/* Professional Toolbar */}
      <div className="tiptap-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="toolbar-button"
            title="Undo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="toolbar-button"
            title="Redo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6"/>
              <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3-2.3"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              const level = parseInt(e.target.value)
              if (level === 0) {
                editor.chain().focus().setParagraph().run()
              } else {
                editor.chain().focus().toggleHeading({ level }).run()
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
            className="toolbar-select"
          >
            <option value={0}>Paragraph</option>
            <option value={1}>Heading 1</option>
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
            <option value={4}>Heading 4</option>
            <option value={5}>Heading 5</option>
            <option value={6}>Heading 6</option>
          </select>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
            title="Bold"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
            title="Italic"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`toolbar-button ${editor.isActive('underline') ? 'active' : ''}`}
            title="Underline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4v7a6 6 0 0 0 12 0V4"/>
              <line x1="4" y1="20" x2="20" y2="20"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`toolbar-button ${editor.isActive('strike') ? 'active' : ''}`}
            title="Strikethrough"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
              <path d="M14 12a4 4 0 0 1 0 8H6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
            title="Bullet List"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`toolbar-button ${editor.isActive('orderedList') ? 'active' : ''}`}
            title="Numbered List"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
              <path d="M4 6h1v4"/>
              <path d="M4 10h2"/>
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`toolbar-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
            title="Align Left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`toolbar-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
            title="Align Center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="10" x2="6" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="18" y1="18" x2="6" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`toolbar-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
            title="Align Right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="7" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="21" y1="18" x2="7" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            onClick={setLink}
            className={`toolbar-button ${editor.isActive('link') ? 'active' : ''}`}
            title="Add Link"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="toolbar-button"
            disabled={isUploading}
            title="Upload Image"
          >
            {isUploading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
              </svg>
            )}
          </button>
          <button
            onClick={addImage}
            className="toolbar-button"
            title="Add Image URL"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1"/>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`toolbar-button ${editor.isActive('blockquote') ? 'active' : ''}`}
            title="Quote"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="toolbar-button"
            title="Horizontal Rule"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="upload-progress">
          <div className="upload-spinner"></div>
          <span>Uploading image...</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Editor Content */}
      <div className={`editor-content-wrapper ${isDragActive ? 'drag-active' : ''}`}>
        {isDragActive && (
          <div className="drag-overlay">
            <div className="drag-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
              </svg>
              <p>Drop your image here to upload</p>
            </div>
          </div>
        )}
        
        <EditorContent editor={editor} className="editor-content" />
        
        {/* Bubble Menu for selected text */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bubble-menu"
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`bubble-button ${editor.isActive('bold') ? 'active' : ''}`}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`bubble-button ${editor.isActive('italic') ? 'active' : ''}`}
            >
              Italic
            </button>
            <button
              onClick={setLink}
              className={`bubble-button ${editor.isActive('link') ? 'active' : ''}`}
            >
              Link
            </button>
          </BubbleMenu>
        )}

        {/* Floating Menu for empty lines */}
        {editor && (
          <FloatingMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="floating-menu"
          >
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="floating-button"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="floating-button"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="floating-button"
            >
              List
            </button>
          </FloatingMenu>
        )}
      </div>
    </div>
  )
}

export default TipTapEditor