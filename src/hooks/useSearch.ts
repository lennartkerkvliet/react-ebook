import * as React from "react"
import { useReader } from "../components/reader"
import { languageInfo } from "../lib/language"
import { createSearcher } from "../lib/search"


export function useSearch(query?: string) {
    const { book, tocProgress, rendererRef, addAnnotation, clearAnnotations } = useReader()
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<{ label: string, href: string }[]>()

    React.useEffect(() => {
        if (!rendererRef.current) return

        setResults(undefined)
        clearAnnotations()

        if (query) {
            setLoading(true)
            
            const abortController = new AbortController()
            const language = languageInfo(book)?.canonical ?? 'en'
            const search = createSearcher(book, language, tocProgress)
            const searchIterator = search({ query })
        
            const processSearchResults = async () => {
                for await (const result of searchIterator) {
                    if (abortController.signal.aborted) return
                    if (result === 'done') {
                        setLoading(false)
                        break
                    }
                    
                    if ('label' in result && typeof result.label === 'string') {
                        setResults((prev) => [...prev ?? [], { label: result.label, href: result.subitems[0].cfi }])

                        for (const item of result.subitems) {
                            addAnnotation(item.cfi)
                        }
                    } else if ('cfi' in result && typeof result.cfi === 'string') {
                        addAnnotation(result.cfi)
                    }
                }
            }
            
            processSearchResults()
            
            return () => {
                abortController.abort()
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [query, rendererRef])

    return { loading, results }
}
