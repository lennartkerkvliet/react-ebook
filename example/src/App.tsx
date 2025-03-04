import React, { useState, useRef } from 'react';
import { Reader, ReaderContent, ReaderNext, ReaderPrevious, loadEPUB, Book } from 'react-ebook'

function App() {
  const [book, setBook] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reader settings
  const [fontSize, setFontSize] = useState(16);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [justify, setJustify] = useState(true);
  const [hyphenate, setHyphenate] = useState(true);
  const [flow, setFlow] = useState<"paginated" | "scrolled">("paginated");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const loadedBook = await loadEPUB(file);
      setBook(loadedBook);
    } catch (error) {
      console.error('Error loading EPUB:', error);
      alert('Failed to load EPUB file. Please try another file.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const loadedBook = await loadEPUB(file);
      setBook(loadedBook);
    } catch (error) {
      console.error('Error loading EPUB:', error);
      alert('Failed to load EPUB file. Please try another file.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app">
      <h1>react-ebook example</h1>
      
      {!book ? (
        <div 
          className="upload-container"
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <h2>Upload EPUB</h2>
          <p>Click to browse or drag and drop an EPUB file here</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".epub"
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <>
          <div className="book-info">
            <h2>{book.metadata?.title || 'Untitled Book'}</h2>
            {book.metadata?.language && <p>Language: {book.metadata.language}</p>}
          </div>

          <div className="reader-options">
            <div className="option-group">
              <label>Font Size</label>
              <div className="font-size-controls">
                <button onClick={() => setFontSize(Math.max(12, fontSize - 1))}>A-</button>
                <span>{fontSize}px</span>
                <button onClick={() => setFontSize(Math.min(24, fontSize + 1))}>A+</button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Line Spacing</label>
              <div className="spacing-controls">
                <button onClick={() => setLineSpacing(Math.max(1.0, lineSpacing - 0.1))}>-</button>
                <span>{lineSpacing.toFixed(1)}</span>
                <button onClick={() => setLineSpacing(Math.min(2.0, lineSpacing + 0.1))}>+</button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Text</label>
              <div className="text-controls">
                <button 
                  title="Justified Text"
                  className={justify ? 'active' : ''} 
                  onClick={() => setJustify(true)}
                >
                  <span className="icon">⟷</span>
                </button>
                <button 
                  title="Left Aligned Text"
                  className={!justify ? 'active' : ''} 
                  onClick={() => setJustify(false)}
                >
                  <span className="icon">⟵</span>
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Hyphenation</label>
              <div className="toggle-control">
                <button 
                  className={hyphenate ? 'active' : ''} 
                  onClick={() => setHyphenate(!hyphenate)}
                >
                  {hyphenate ? 'On' : 'Off'}
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>View Mode</label>
              <div className="flow-controls">
                <button 
                  title="Paginated View"
                  className={flow === 'paginated' ? 'active' : ''} 
                  onClick={() => setFlow('paginated')}
                >
                  <span className="icon">⊞</span>
                </button>
                <button 
                  title="Scrolled View"
                  className={flow === 'scrolled' ? 'active' : ''} 
                  onClick={() => setFlow('scrolled')}
                >
                  <span className="icon">≡</span>
                </button>
              </div>
            </div>
          </div>

          <Reader book={book}>
            <div className="reader-container">
              <ReaderContent 
                fontSize={fontSize} 
                lineSpacing={lineSpacing} 
                justify={justify} 
                hyphenate={hyphenate} 
                flow={flow} 
              />
            </div>
            <div className="reader-controls">
              <ReaderPrevious>Previous Page</ReaderPrevious>
              <ReaderNext>Next Page</ReaderNext>
            </div>
          </Reader>

          <button className="upload-button" onClick={() => setBook(null)}>Upload Another Book</button>
        </>
      )}
    </div>
  );
}

export default App; 