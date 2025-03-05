import React, { useState, useRef } from 'react';
import { Reader, ReaderContent, ReaderNext, ReaderPrevious, loadEPUB, Book, useSearch, useBookNavigator } from 'react-ebookjs'

function App() {
  const [book, setBook] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reader settings
  const [fontSize, setFontSize] = useState(16);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [justify, setJustify] = useState(true);
  const [hyphenate, setHyphenate] = useState(true);
  const [flow, setFlow] = useState<"paginated" | "scrolled">("paginated");
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showTOC, setShowTOC] = useState(false);

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
            
            <div className="option-group">
              <label>Search</label>
              <div className="search-control">
                <button 
                  title="Toggle Search"
                  className={showSearch ? 'active' : ''} 
                  onClick={() => {
                    setShowSearch(!showSearch);
                    if (showTOC) setShowTOC(false);
                  }}
                >
                  <span className="icon">🔍</span>
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Contents</label>
              <div className="toc-control">
                <button 
                  title="Toggle Table of Contents"
                  className={showTOC ? 'active' : ''} 
                  onClick={() => {
                    setShowTOC(!showTOC);
                    if (showSearch) setShowSearch(false);
                  }}
                >
                  <span className="icon">≡</span>
                </button>
              </div>
            </div>
          </div>

          <Reader 
            book={book} 
            progress={progress}
            onProgressChange={setProgress}
          >
            {showSearch && (
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in book..."
                  className="search-input"
                />
                <SearchResults query={searchQuery} />
              </div>
            )}
            
            {showTOC && (
              <div className="toc-container">
                <h3>Table of Contents</h3>
                <TableOfContents toc={book.toc} />
              </div>
            )}
            
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
              <div className="progress-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="progress-slider"
                  title={`${Math.round(progress * 100)}%`}
                />
                <div className="progress-label">{Math.round(progress * 100)}%</div>
              </div>
              <ReaderNext>Next Page</ReaderNext>
            </div>
          </Reader>

          <button className="upload-button" onClick={() => setBook(null)}>Upload Another Book</button>
        </>
      )}
    </div>
  );
}

// Search Results component to display search results
function SearchResults({ query }: { query: string }) {
  // Using the real useReaderSearch hook
  const { loading, results } = useSearch(query);
  const { goTo } = useBookNavigator()
  
  // Handle click on a search result to navigate to that location
  const handleResultClick = async (result: any) => {
    await goTo(result.href)
  };

  if (!results) return null;

  return (
    <div className="search-results">
      {loading ? (
        <div className="search-loading">Searching...</div>
      ) : results.length > 0 ? (
        <div className="search-results-list">
          <div className="search-results-header">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          {results.map((result: any, index: number) => (
            <div 
              key={index} 
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              {result.label || result}
            </div>
          ))}
        </div>
      ) : (
        <div className="search-no-results">No results found</div>
      )}
    </div>
  );
}

// Table of Contents component to display the book's table of contents
interface TableOfContentsProps {
  toc: Array<{
    label: string;
    href: string;
    subitems?: Array<{
      label: string;
      href: string;
      subitems?: any;
    }> | null;
  }>;
}

function TableOfContents({ toc }: TableOfContentsProps) {
  const { goTo } = useBookNavigator();
  
  // Handle click on a TOC item to navigate to that location
  const handleTOCItemClick = async (href: string) => {
    await goTo(href);
  };

  // Recursive function to render TOC items with their subitems
  const renderTOCItems = (items: TableOfContentsProps['toc']) => {
    if (!items || items.length === 0) return null;
    
    return (
      <ul className="toc-list">
        {items.map((item, index) => (
          <li key={index} className="toc-item">
            <div 
              className="toc-item-label"
              onClick={() => handleTOCItemClick(item.href)}
            >
              {item.label}
            </div>
            {item.subitems && renderTOCItems(item.subitems)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="table-of-contents">
      {renderTOCItems(toc)}
    </div>
  );
}

export default App; 