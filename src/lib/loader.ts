import { configure, ZipReader, BlobReader, TextWriter, BlobWriter } from "@zip.js/zip.js"
import { EPUB } from "../vendor/foliate-js/epub.js"
import { makeFB2 } from "../vendor/foliate-js/fb2.js"
import { makeComicBook } from "../vendor/foliate-js/comic-book.js"
import { Book } from "./book"


const isZip = async (blob: Blob) => {
    const arr = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
    return arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04
}

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

export async function loadFB2(blob: Blob): Promise<Book> {
    if (await isZip(blob)) {
        const loader = await makeZipLoader(blob)
        const entry = loader.entries.find(entry => entry.filename.endsWith('.fb2'))
        const file = await loader.loadBlob((entry ?? loader.entries[0]).filename)
        return await makeFB2(file)
    } else {
        return await makeFB2(blob)
    }
}

export async function loadComicBook(blob: Blob): Promise<Book> {
    const loader = await makeZipLoader(blob)
    return makeComicBook(loader, blob)
}
