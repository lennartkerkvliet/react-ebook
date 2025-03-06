import { searchMatcher } from "../vendor/foliate-js/search.js"
import { textWalker } from "../vendor/foliate-js/text-walker.js"
import { TOCProgress } from "../vendor/foliate-js/progress.js"
import * as CFI from '../vendor/foliate-js/epubcfi.js'
import { Book } from "./book.js"

export class Search {
    private book: Book
    private language: string
    private tocProgress?: TOCProgress

    constructor(book: Book, language: string, tocProgress?: TOCProgress) {
        this.book = book
        this.language = language
        this.tocProgress = tocProgress
    }

    private getCFI(index: number, range?: any): string {
        const baseCFI = this.book.sections?.[index]?.cfi ?? CFI.fake.fromIndex(index)
        if (!range) return baseCFI
        return CFI.joinIndir(baseCFI, CFI.fromRange(range))
    }

    private async * searchSection(matcher: any, query: string, index: number) {
        const doc = await this.book.sections?.[index]?.createDocument()
        for (const { range, excerpt } of matcher(doc, query))
            yield { cfi: this.getCFI(index, range), excerpt }
    }

    private async * searchBook(matcher: any, query: string) {
        const { sections } = this.book
        if (!sections) return

        for (const [index, section] of sections.entries()) {
            if (!section?.createDocument) continue
            
            const doc = await section.createDocument()
            const subitems = Array.from(matcher(doc, query), ({ range, excerpt }) =>
                ({ cfi: this.getCFI(index, range), excerpt }))
   
            if (subitems.length) yield { index, subitems }
        }
    }
    async * search({ query, index }: { query: string, index?: number }) {
        const matcher = searchMatcher(textWalker, { defaultLocale: this.language, query, index })
        const iter = index != null
            ? this.searchSection(matcher, query, index)
            : this.searchBook(matcher, query)
    
        for await (const result of iter) {
            if ("subitems" in result && result.subitems) {
                yield {
                    label: this.tocProgress?.getProgress(result.index)?.label ?? '',
                    subitems: result.subitems,
                }
            }
            else {
                yield result
            }
        }
        yield 'done'
    }
}
