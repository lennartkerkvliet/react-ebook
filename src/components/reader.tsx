"use client"

import * as React from "react";
import * as CFI from '../vendor/foliate-js/epubcfi.js'
import { Book } from "../lib/book.js";
import { languageInfo } from "../lib/language.js";
import { SectionProgress, TOCProgress } from "../vendor/foliate-js/progress.js";
import { Overlayer } from "../vendor/foliate-js/overlayer.js";
import { Paginator } from "../vendor/foliate-js/paginator.js";
import { FixedLayout } from "../vendor/foliate-js/fixed-layout.js";
import "../vendor/foliate-js/paginator.js";
import "../vendor/foliate-js/fixed-layout.js";


declare module "react" {
    namespace JSX {
      interface IntrinsicElements {
        'foliate-paginator': React.DetailedHTMLProps<React.HTMLAttributes<Paginator>, Paginator>;
        'foliate-fixed-layout': React.DetailedHTMLProps<React.HTMLAttributes<FixedLayout>, FixedLayout>;
      }
    }
}

interface ReaderContextType {
    book: Book
    sectionProgress: SectionProgress
    annotations: string[]
    tocProgress?: TOCProgress
    rendererRef: React.RefObject<Paginator | FixedLayout | null>;
    
    goTo: (target: number | string | { fraction: number }) => Promise<void>;
    next: (distance?: number) => Promise<void>;
    previous: (distance?: number) => Promise<void>;

    addAnnotation: (cfi: string) => void;
    removeAnnotation: (cfi: string) => void;
    clearAnnotations: () => void;
}
  
const ReaderContext = React.createContext<ReaderContextType | null>(null)

function useReader() {
    const context = React.useContext(ReaderContext)
    if (!context) {
        throw new Error("useReader must be used within a <Reader />")
    }
    return context
}

const resolveNavigation = (
    book: Book,
    target: number | string | { fraction: number }, 
    sectionProgress: SectionProgress
) => {
    if (typeof target === 'number') {
        return { index: target }
    } else if (typeof target === 'object') {
        const [index, anchor] = sectionProgress.getSection(target.fraction)
        return { index, anchor }
    } else if (CFI.isCFI.test(target)) {
        if (book.resolveCFI) {
            return book.resolveCFI(target)
        } else {
            const parts = CFI.parse(target)
            const index = CFI.fake.toIndex((parts.parent ?? parts).shift())
            const anchor = (doc: any) => CFI.toRange(doc, parts)
            return { index, anchor }
        }
    } else {
        const href = book.resolveHref?.(target)
        if (href === null) return
        return href
    }
}

interface ReaderProps {
    book: Book
    progress?: number
    onProgressChange?: (progress: number) => void
    children: React.ReactNode
}

function Reader({ book, progress, onProgressChange, children }: ReaderProps) {
    const rendererRef = React.useRef<Paginator | FixedLayout>(null)
    const sectionProgress = React.useMemo(() => new SectionProgress(book.sections, 1500, 1600), [book])
    const [tocProgress, setTocProgress] = React.useState<TOCProgress | undefined>()
    const [currentProgress, setCurrentProgress] = React.useState(0)
    const [annotations, setAnnotations] = React.useState<string[]>([])

    function addAnnotation(cfi: string) {
        const resolved = resolveNavigation(book, cfi, sectionProgress)
        if (resolved) {
            const content = rendererRef.current?.getContents()
                .find((x: any) => x.index === resolved.index && x.overlayer)

            if (content && "overlayer" in content) {
                const { overlayer, doc } = content
                const range = doc && typeof resolved.anchor === 'function' ? resolved.anchor(doc) : resolved.anchor
                overlayer.add(cfi, range, Overlayer.outline)
            }
            
            setAnnotations((prev) => [...prev, cfi])
        }
    }

    function removeAnnotation(cfi: string) {
        const content = rendererRef.current?.getContents()
        if (!content) return

        for (const item of content) {
            if ("overlayer" in item) {
                const { overlayer } = item
                overlayer.remove(cfi)
            }
        }
        setAnnotations((prev) => prev.filter((x) => x !== cfi))
    }

    function clearAnnotations() {
        for (const cfi of annotations) {
            removeAnnotation(cfi)
        }
    }
    
    async function goTo(target: number | string | { fraction: number }) {
        const resolved = resolveNavigation(book, target, sectionProgress)
        if (resolved) {
            await rendererRef.current?.goTo(resolved)
        }
    }
    
    React.useEffect(() => {
        if (book.splitTOCHref && book.getTOCFragment) {
            const ids = book.sections?.map(s => s?.id)
            const splitHref = book.splitTOCHref.bind(book)
            const getFragment = book.getTOCFragment.bind(book)

            const tocProgress = new TOCProgress()
            tocProgress.init({ toc: book.toc, ids, splitHref, getFragment })
            setTocProgress(tocProgress)
        }
    }, [book])

    React.useEffect(() => {
        if (progress !== currentProgress && progress !== undefined) {
            goTo({ fraction: progress })
        }
    }, [progress, currentProgress, rendererRef])

    React.useEffect(() => {
        const handleRelocate = (event: any) => {
            const { index, fraction, size } = event.detail
            const { fraction: progress } = sectionProgress.getProgress(index, fraction, size)
            setCurrentProgress(progress)
            onProgressChange?.(progress)
        }

        rendererRef.current?.addEventListener('relocate', handleRelocate)

        return () => {
            rendererRef.current?.removeEventListener('relocate', handleRelocate)
        }
    }, [onProgressChange, rendererRef])

    async function next(distance?: number) {
        await rendererRef.current?.next(distance)
    }

    async function previous(distance?: number) {
        await rendererRef.current?.prev(distance)
    }

    return (
        <ReaderContext.Provider value={{ 
            book, 
            sectionProgress, 
            annotations,
            tocProgress, 
            rendererRef, 
            goTo, 
            next, 
            previous, 
            addAnnotation, 
            removeAnnotation, 
            clearAnnotations 
        }}>
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
    const { book, rendererRef, annotations, sectionProgress } = useReader()
    const info = languageInfo(book)

    React.useEffect(() => {
        const renderer = rendererRef.current
        if (renderer) {
            const createOverlayer = (e: any) => {
                const overlayer = new Overlayer()
                const { index, doc, attach } = e.detail

                doc.addEventListener('click', (e: MouseEvent) => {
                    const [value, range] = overlayer.hitTest(e)
                    if (value && range) {
                        // TODO: Add annotation click handler
                        console.log(value, range, index)
                    }
                })

                for (const cfi of annotations) {
                    const resolved = resolveNavigation(book, cfi, sectionProgress)
                    if (resolved) {
                        if (index === resolved.index) {
                            const range = doc && typeof resolved.anchor === 'function' ? resolved.anchor(doc) : resolved.anchor 
                            overlayer.add(cfi, range, Overlayer.outline)
                        }
                    }
                }

                attach(overlayer)
            }

            renderer.addEventListener('create-overlayer', createOverlayer)
            renderer.setAttribute('exportparts', 'head,foot,filter')
            renderer.open(book)
            renderer.next()

            return () => {
                renderer.removeEventListener('create-overlayer', createOverlayer)
            }
        }
    }, [book, rendererRef, annotations])
    
    React.useEffect(() => {
        if (!rendererRef.current) return;

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

        rendererRef.current.setAttribute('flow', flow)
        if (rendererRef.current instanceof Paginator) {
            rendererRef.current.setStyles(css)
        }
    }, [fontSize, lineSpacing, justify, hyphenate, flow])

    const isFixedLayout = book.rendition?.layout === 'pre-paginated'
    const Renderer = isFixedLayout ? "foliate-fixed-layout" : "foliate-paginator"

    return <Renderer 
        dir={info?.direction} 
        lang={info?.canonical} 
        ref={rendererRef as any} 
    />
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
    ReaderPrevious,
    useReader
};
