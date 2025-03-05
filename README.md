# react-ebook

A minimal, unstyled React component library for rendering and interacting with ebooks in web applications.

## Overview

`react-ebook` provides React components and utilities for displaying and navigating ebooks in various formats (EPUB, FB2, Comic Books) in web applications. It is built on top of [foliate-js](https://github.com/johnfactotum/foliate-js), the JavaScript library that powers the [Foliate](https://johnfactotum.github.io/foliate/) ebook reader application.

> **Note:** This package relies on foliate-js, which is currently in development and not yet considered stable. APIs may change in future versions.

## Features

- Render ebooks in EPUB, FB2, and Comic Book formats
- Paginated or scrolled reading modes
- Navigation controls (next/previous page)
- Table of contents navigation
- Search functionality
- Customizable text display (font size, line spacing, justification, hyphenation)
- Progress tracking

## Installation

```bash
npm install react-ebook
```

## Usage

```jsx
import { useState } from 'react';
import { 
  Reader, 
  ReaderContent, 
  ReaderNext, 
  ReaderPrevious, 
  loadEPUB 
} from 'react-ebook';

function EbookReader() {
  const [book, setBook] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const loadedBook = await loadEPUB(file);
      setBook(loadedBook);
    }
  };

  if (!book) {
    return (
      <div>
        <h2>Select an ebook to read</h2>
        <input type="file" accept=".epub" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <Reader 
      book={book} 
      progress={progress}
      onProgressChange={setProgress}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ReaderContent 
            fontSize={16}
            lineSpacing={1.5}
            justify={true}
            hyphenate={true}
            flow="paginated"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
          <ReaderPrevious>Previous</ReaderPrevious>
          <div>{Math.round(progress * 100)}%</div>
          <ReaderNext>Next</ReaderNext>
        </div>
      </div>
    </Reader>
  );
}
```

## Philosophy

`react-ebook` is intentionally designed to be minimal and unstyled, focusing on functionality rather than appearance. This gives you complete control over the styling and integration with your application's design system.

The library provides the core functionality needed to render and interact with ebooks, while leaving the UI implementation details to you. This approach makes it highly flexible and adaptable to different design requirements.

## Supported Formats

- EPUB (2 and 3)
- FB2
- Comic Books (CBZ, CBR)

## API

### Components

- `Reader`: The main component that provides the reading context
- `ReaderContent`: Renders the book content
- `ReaderNext`: Button component to navigate to the next page
- `ReaderPrevious`: Button component to navigate to the previous page

### Hooks

- `useBookNavigator`: Hook for programmatic navigation
- `useSearch`: Hook for searching within the book

### Loaders

- `loadEPUB`: Load an EPUB file
- `loadFB2`: Load an FB2 file
- `loadComicBook`: Load a comic book file (CBZ, CBR)

## Credits

This library is built on top of [foliate-js](https://github.com/johnfactotum/foliate-js), created by John Factotum. Foliate-js is the JavaScript library that powers the [Foliate](https://johnfactotum.github.io/foliate/) ebook reader application.

## License

MIT
