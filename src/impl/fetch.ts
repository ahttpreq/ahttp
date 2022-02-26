import { run } from 'libsugar/effect'
import type { AHttpImpl, ARequest, AHttpImplRes, AResType, AContext } from '../types'
import { tryURL } from '../utils'

/** fetch 实现 */
export const FetchImpl: AHttpImpl = async <T>(ctx: AContext<T>, body: any, req: ARequest, type: AResType): AHttpImplRes<T> => {
  const controller = new AbortController()
  ctx.on('abort', () => controller.abort())
  const rres = await fetch(req.url.href, {
    method: req.method,
    body,
    headers: req.headers,
    signal: controller.signal,
    mode: 'cors',
    credentials: 'include',
  })
  const robj: Awaited<AHttpImplRes<T>> = {
    headers: rres.headers,
    ok: rres.ok,
    status: rres.status,
    statusText: rres.statusText,
    url: tryURL(rres.url) ?? req.url,
  } as any
  if (rres.ok)
    robj.data = await run(async () => {
      if (!rres.ok) return
      switch (type) {
        case 'auto':
          return await read_body_by_content_type(rres, rres.headers.get('content-type'), rres.headers.get('content-length'))
        case 'text':
          return await rres.text()
        case 'blob':
          return await rres.blob()
        case 'arraybuffer':
          return await rres.arrayBuffer()
        case 'formData':
          return await rres.formData()
        case 'query':
          return new URLSearchParams(await rres.text())
        default:
          return await rres.json()
      }
    })
  if (!rres.ok) {
    try {
      robj.err = await read_body_by_content_type(rres, rres.headers.get('content-type'), rres.headers.get('content-length'))
    } catch (_) {}
  }
  return robj
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
    return await res.text()
  }
  if (content_type === 'application/json' || content_type === 'text/json') {
    return await res.json()
  }
  if (content_type === 'application/x-www-form-urlencoded') {
    return new URLSearchParams(await res.text())
  }
  if (blob_start.test(content_type) || blob_types.has(content_type)) {
    return await res.blob()
  }
  if (content_type === 'multipart/form-data') {
    return await res.formData()
  }
  return await res.text()
}
