export interface TableOfContentsItem {
  label: string
  href: string
  subitems?: TableOfContentsItem[] | null
  type?: string[]
}

export interface Section {
  id?: string
  linear?: string
  cfi?: string
  createDocument: () => Promise<any>
  resolveHref?: (href: string) => string | null
}

type ResolveIndex = { index: number, anchor?: (doc: any) => any }
type EPUBEntity = { 
  name: string, 
  sortAs?: string, 
  role?: string, 
  code?: string, 
  scheme?: string 
}

export interface Book {
  metadata?: {
    identifier?: string
    title?: string
    language?: string[] | string
    description?: string
    author?: string[] | EPUBEntity[]
    translator?: string[] | EPUBEntity[]
    contributor?: string[] | EPUBEntity[]
    publisher?: string | EPUBEntity | null
    published?: string
    modified?: string
  }
  toc: TableOfContentsItem[]
  pageList?: TableOfContentsItem[]
  landmarks?: TableOfContentsItem[]
  rendition?: {
    layout?: string
  }
  sections?: Array<Section | null>
  dir?: string
  getCover?: () => Promise<Blob | null>
  resolveHref?: (href: string) => ResolveIndex | null
  resolveCFI?: (cfi: string) => ResolveIndex
  splitTOCHref?: (href: string) => string | string[]
  getTOCFragment?: (href: string) => string
  isExternal?: (href: string) => boolean
}
