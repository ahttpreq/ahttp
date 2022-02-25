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
  const data = await run(async () => {
    switch (type) {
      case 'text':
        return await rres.text()
      case 'blob':
        return await rres.blob()
      case 'arraybuffer':
        return await rres.arrayBuffer()
      case 'formData':
        return await rres.formData()
      default:
        return await rres.json()
    }
  })
  return {
    data,
    headers: rres.headers,
    ok: rres.ok,
    status: rres.status,
    statusText: rres.statusText,
    url: tryURL(rres.url) ?? req.url,
  }
}
