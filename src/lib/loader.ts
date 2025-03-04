import { configure, ZipReader, BlobReader, TextWriter, BlobWriter } from "@zip.js/zip.js"
import { EPUB } from "../vendor/foliate-js/epub.js"
import { Book } from "./book"


const makeZipLoader = async (blob: Blob) => {
    configure({ useWebWorkers: false })
    const reader = new ZipReader(new BlobReader(blob))
    const entries = await reader.getEntries()
    const map = new Map(entries.map(entry => [entry.filename, entry]))

    const load = (f: (entry: any, ...args: any[]) => any) => (name: string, ...args: any[]) =>
        map.has(name) ? f(map.get(name), ...args) : null
    
    const loadText = load(entry => entry.getData(new TextWriter()))
    const loadBlob = load((entry, type) => entry.getData(new BlobWriter(type)))
    const getSize = (name: string) => map.get(name)?.uncompressedSize ?? 0
    return { entries, loadText, loadBlob, getSize, sha1: undefined }
}

export async function loadEPUB(blob: Blob): Promise<Book> {
    const loader = await makeZipLoader(blob)
    const epub = new EPUB(loader)
    return epub.init()
}