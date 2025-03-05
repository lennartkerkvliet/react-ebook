export interface TableOfContentsItem {
  label: string
  href: string
  subitems?: TableOfContentsItem[] | null
  type?: string[]
}

type Entity = { name: string, sortAs?: string, role?: string } | string

export interface Book {
  metadata?: {
    identifier?: string
    title?: string
    language?: string[] | string
    description?: string
    author?: Entity[]
    translator?: Entity[]
    contributor?: Entity[]
    publisher?: Entity | null
    published?: string
    modified?: string
    subject?: string[]
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
