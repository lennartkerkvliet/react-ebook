import { searchMatcher } from "../vendor/foliate-js/search.js"
import { textWalker } from "../vendor/foliate-js/text-walker.js"
import { TOCProgress } from "../vendor/foliate-js/progress.js"
import * as CFI from '../vendor/foliate-js/epubcfi.js'
import { Book } from "./book.js"


function getCFI(book: Book, index: number, range?: any): string {
    const baseCFI = book.sections?.[index]?.cfi ?? CFI.fake.fromIndex(index)
    if (!range) return baseCFI
    return CFI.joinIndir(baseCFI, CFI.fromRange(range))
}

export function createSearcher(book: Book, language: string, tocProgress?: TOCProgress) {
   
    async function* searchSection(matcher: any, query: string, index: number) {
        const doc = await book.sections?.[index]?.createDocument()
        for (const { range, excerpt } of matcher(doc, query))
            yield { cfi: getCFI(book, index, range), excerpt }
    }

    async function* searchBook(matcher: any, query: string) {
        const { sections } = book
        if (!sections) return

        for (const [index, section] of sections.entries()) {
            if (!section?.createDocument) continue
            
            const doc = await section.createDocument()
            const subitems = Array.from(matcher(doc, query), ({ range, excerpt }) =>
                ({ cfi: getCFI(book, index, range), excerpt }))
   
            if (subitems.length) yield { index, subitems }
        }
    }

    async function* search({ query, index }: { query: string, index?: number }) {
        const matcher = searchMatcher(textWalker, { defaultLocale: language, query, index })
        const iter = index != null
            ? searchSection(matcher, query, index)
            : searchBook(matcher, query)
    
        for await (const result of iter) {
            if ("subitems" in result && result.subitems) {
                yield {
                    label: tocProgress?.getProgress(result.index)?.label ?? '',
                    subitems: result.subitems,
                }
            }
            else {
                yield result
            }
        }
        yield 'done'
    }

    return search
}
