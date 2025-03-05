export interface TableOfContentsItem {
  label: string
  href: string
  subitems?: TableOfContentsItem[] | null
  type?: string[]
}

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
  dir?: string
  getCover?: () => Promise<Blob | null>
}
