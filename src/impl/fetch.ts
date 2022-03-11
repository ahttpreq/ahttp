import { defineImpl } from '.'
import {
  AHttpReadBodyBlobFormatError,
  AHttpReadBodyBufferFormatError,
  AHttpReadBodyFormFormatError,
  AHttpReadBodyJsonFormatError,
  AHttpReadBodyQueryFormatError,
  AHttpReadBodyTextFormatError,
} from '../error'
import type { AResType, AHttpImplRes, AContext, AHttpImplSession } from '../types'

/** fetch 实现 */
export const FetchImpl = defineImpl(async (ctx: AContext, url: URL, method: string, headers: Headers, body: BodyInit | null): Promise<AHttpImplSession> => {
  const controller = new AbortController()
  ctx.on('abort', () => controller.abort())
  const res = await fetch(url.href, {
    method,
    body,
    headers,
    signal: controller.signal,
    mode: 'cors',
    credentials: 'include',
  })
  return new FetchAHttpImplSession(res)
})

class FetchAHttpImplSession implements AHttpImplSession {
  constructor(public res: Response) {}

  async auto<T>(): Promise<AHttpImplRes<T>> {
    return await take(this.res, 'auto')
  }
  async json<T>(): Promise<AHttpImplRes<T>> {
    return await take(this.res, 'json')
  }
  async query(): Promise<AHttpImplRes<URLSearchParams>> {
    return await take(this.res, 'query')
  }
  async buffer(): Promise<AHttpImplRes<ArrayBuffer>> {
    return await take(this.res, 'buffer')
  }
  async text(): Promise<AHttpImplRes<string>> {
    return await take(this.res, 'text')
  }
  async blob(): Promise<AHttpImplRes<Blob>> {
    return await take(this.res, 'blob')
  }
  async form(): Promise<AHttpImplRes<FormData>> {
    return await take(this.res, 'form')
  }
}

async function take<T>(res: Response, type: AResType): Promise<AHttpImplRes<T>> {
  const data = res.ok ? await read_body(type, res) : void 0
  const err = !res.ok ? await try_read_body_auto_infer(res) : void 0
  return {
    raw: res,
    data,
    err,
    headers: res.headers,
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    url: res.url,
  }
}

async function read_body(type: AResType, res: Response) {
  switch (type) {
    case 'auto':
      return await read_body_auto_infer(res)
    case 'json':
      try {
        return await res.json()
      } catch (e) {
        throw new AHttpReadBodyJsonFormatError(e, res)
      }
    case 'blob':
      try {
        return await res.blob()
      } catch (e) {
        throw new AHttpReadBodyBlobFormatError(e, res)
      }
    case 'buffer':
      try {
        return await res.arrayBuffer()
      } catch (e) {
        throw new AHttpReadBodyBufferFormatError(e, res)
      }
    case 'form':
      try {
        return await res.formData()
      } catch (e) {
        throw new AHttpReadBodyFormFormatError(e, res)
      }
    case 'text':
      try {
        return await res.text()
      } catch (e) {
        throw new AHttpReadBodyTextFormatError(e, res)
      }
    case 'query':
      try {
        new URLSearchParams(await res.text())
      } catch (e) {
        throw new AHttpReadBodyQueryFormatError(e, res)
      }
    default:
      return await read_body_auto_infer(res)
  }
}

async function read_body_auto_infer(res: Response) {
  return await read_body_by_content_type(res, res.headers.get('content-type'), res.headers.get('content-length'))
}

async function try_read_body_auto_infer(res: Response) {
  try {
    return await read_body_by_content_type(res, res.headers.get('content-type'), res.headers.get('content-length'))
  } catch (_) {
    return
  }
}

/** 判断是否应该用 text 读 */
const text_start = /^(text)(\/.+)?/giu
const text_types = new Set(['application/base64', 'application/plain', 'application/xml'])

/** 判断是否应该用 blob 读 */
const blob_start = /^(image|video|audio|font|model|music|x-music)(\/.+)?/giu
const blob_types = new Set([
  'application/octet-stream',
  'application/mac-binary',
  'application/macbinary',
  'application/x-binary',
  'application/x-macbinary',
  'application/msword',
  'application/x-gtar',
  'application/x-compressed',
  'application/x-gzip',
  'application/x-midi',
  'application/x-frame',
  'application/pdf',
  'application/mspowerpoint',
  'application/vnd.ms-powerpoint',
  'application/powerpoint',
  'application/x-mspowerpoint',
  'application/x-tar',
  'application/gnutar',
  'application/world',
  'application/x-world',
  'application/wordperfect',
  'application/excel',
  'application/x-excel',
  'application/x-msexcel',
  'application/vnd.ms-excel',
  'application/x-compress',
  'application/x-zip-compressed',
  'application/zip',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/x-gca-compressed',
  'application/x-lzh-compressed',
  'application/vnd.ms-cab-compressed',
  'application/x-ace-compressed',
  'application/x-cfs-compressed',
  'application/x-dgc-compressed',
  'application/x-java-archive',
])

/** 根据响应的 content_type 解析返回值 */
async function read_body_by_content_type(res: Response, content_type?: string | null, content_length?: string | null) {
  if (content_length && !+content_length) return
  if (!content_type || text_start.test(content_type) || text_types.has(content_type)) {
    try {
      return await res.text()
    } catch (e) {
      throw new AHttpReadBodyTextFormatError(e, res)
    }
  }
  if (content_type === 'application/json' || content_type === 'text/json') {
    try {
      return await res.json()
    } catch (e) {
      throw new AHttpReadBodyJsonFormatError(e, res)
    }
  }
  if (content_type === 'application/x-www-form-urlencoded') {
    try {
      new URLSearchParams(await res.text())
    } catch (e) {
      throw new AHttpReadBodyQueryFormatError(e, res)
    }
  }
  if (blob_start.test(content_type) || blob_types.has(content_type)) {
    try {
      return await res.blob()
    } catch (e) {
      throw new AHttpReadBodyBlobFormatError(e, res)
    }
  }
  if (content_type === 'multipart/form-data') {
    try {
      return await res.formData()
    } catch (e) {
      throw new AHttpReadBodyFormFormatError(e, res)
    }
  }
  try {
    return await res.text()
  } catch (e) {
    throw new AHttpReadBodyTextFormatError(e, res)
  }
}
