import { Book } from "./book"

export interface LanguageInfo {
    canonical: string
    locale: Intl.Locale
    isCJK: boolean
    direction: "ltr" | "rtl"
}
  
export const languageInfo = (book: Book): LanguageInfo | undefined => {
    const lang = book.metadata?.language
    if (!lang) return
    
    const canonical = Intl.getCanonicalLocales(lang)[0]
    const locale = new Intl.Locale(canonical)
    const isCJK = ['zh', 'ja', 'kr'].includes(locale.language)
  
    if ("getTextInfo" in locale) {
        // @ts-ignore
        const direction = locale.getTextInfo().direction
        return { canonical, locale, isCJK, direction }
    } else {
        const direction= locale.language === 'ar' || locale.language === 'he' ? 'rtl' : 'ltr'
        return { canonical, locale, isCJK, direction }
    }
}