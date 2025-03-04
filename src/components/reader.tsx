"use client"

import * as React from "react";
import { Book } from "../lib/book.js";
import { View as FoliateView } from "../vendor/foliate-js/view.js";
import "../vendor/foliate-js/view.js";

declare module "react" {
    namespace JSX {
      interface IntrinsicElements {
        'foliate-view': React.DetailedHTMLProps<React.HTMLAttributes<FoliateView>, FoliateView>;
      }
    }
}

interface ReaderContextType {
    book: Book
    viewRef: React.RefObject<FoliateView | null>;
    
    next: (distance?: number) => Promise<void>;
    previous: (distance?: number) => Promise<void>;
}
  
const ReaderContext = React.createContext<ReaderContextType | null>(null)

function useReader() {
    const context = React.useContext(ReaderContext)
    if (!context) throw new Error("useReader must be used within a <Reader />")
    return context
  }

interface ReaderProps {
    book: Book
    children: React.ReactNode
}

function Reader({ book, children }: ReaderProps) {
    const viewRef = React.useRef<FoliateView>(null)

    async function next(distance?: number) {
        await viewRef.current?.next(distance)
    }

    async function previous(distance?: number) {
        await viewRef.current?.prev(distance)
    }

    return (
        <ReaderContext.Provider value={{ book, viewRef, next, previous }}>
            {children}
        </ReaderContext.Provider>
    )
}

interface ReaderContentProps {
    fontSize?: number;
    lineSpacing?: number;
    justify?: boolean;
    hyphenate?: boolean;
    flow?: "paginated" | "scrolled";
}

function ReaderContent({ 
    fontSize = 16, 
    lineSpacing = 1.5, 
    justify = true, 
    hyphenate = true,
    flow = "paginated"
}: ReaderContentProps) {
    const { book, viewRef } = useReader()

    React.useEffect(() => {
        const view = viewRef.current
        if (!view) return

        const openBook = async (book: Book) => {
            await view.open(book)
            await view.init({ 
                lastLocation: null, 
                showTextStart: true 
            })
        }

        if (view.book !== book) {
            openBook(book)
        }
    }, [book, viewRef])
    
    React.useEffect(() => {
        if (!viewRef.current) return;

        const css = `
            @namespace epub "http://www.idpf.org/2007/ops";
            html {
                color-scheme: light dark;
                font-size: ${fontSize}px;
            }
            p, li, blockquote, dd {
                line-height: ${lineSpacing};
                text-align: ${justify ? 'justify' : 'start'};
                -webkit-hyphens: ${hyphenate ? 'auto' : 'manual'};
                hyphens: ${hyphenate ? 'auto' : 'manual'};
                -webkit-hyphenate-limit-before: 3;
                -webkit-hyphenate-limit-after: 2;
                -webkit-hyphenate-limit-lines: 2;
                hanging-punctuation: allow-end last;
                widows: 2;
            }
            [align="left"] { text-align: left; }
            [align="right"] { text-align: right; }
            [align="center"] { text-align: center; }
            [align="justify"] { text-align: justify; }
        `;

        // @ts-ignore
        viewRef.current.renderer?.setStyles?.(css)
        viewRef.current.renderer?.setAttribute('flow', flow)

    }, [fontSize, lineSpacing, justify, hyphenate, flow, viewRef])

    return (
        <foliate-view ref={viewRef} />
    )
}

function ReaderNext({ children, ...props }: Omit<React.ComponentProps<"button">, "onClick">) {
    const { next } = useReader()

    return (
        <button onClick={() => next()} {...props}>{children}</button>
    )
}

function ReaderPrevious({ children, ...props }: Omit<React.ComponentProps<"button">, "onClick">) {
    const { previous } = useReader()

    return (
        <button onClick={() => previous()} {...props}>{children}</button>
    )   
}
export {
    Reader,
    ReaderContent,
    ReaderNext,
    ReaderPrevious
};
