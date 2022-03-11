import { AHttpPayload, AReqType, ARequest, AResponse, AResType, AUrl } from './types'
import { Req, Res } from './symbol'
import type { Maybe, Voidable } from 'libsugar/maybe'
import isAbsoluteUrl from 'is-absolute-url'
import { buildFormData, buildQueryString } from './utils'

/** 构造 ARequest */
export function makeARequest(base: AUrl, url: AUrl, method: string, type: AReqType, data: Maybe<AHttpPayload>, query: URLSearchParams, headers: Headers): ARequest {
  return {
    [Req]: true,
    base,
    url,
    method,
    type,
    data,
    query,
    headers,
  }
}

/** 构造 AResponse */
export function makeAResponse<T>(type: AResType, data: any, err: any, headers: Headers, ok: boolean, status: number, statusText: string, url: URL): AResponse<T> {
  return {
    [Res]: true,
    type,
    data,
    err,
    headers,
    ok,
    status,
    statusText,
    url,
  }
}

/** 尝试构造一个 URL */
export function tryURL(a: AUrl): Voidable<URL> {
  try {
    return makeURL(a)
  } catch (_) {
    return
  }
}

/** 标准化 URL */
export function makeURL(url: AUrl, base?: AUrl): URL {
  function make<T>(url: T): AUrl | T {
    if (typeof url === 'string') {
      if (isAbsoluteUrl(url)) return url
      else return new URL(url, location.href)
    } else return url
  }
  if (base != null) return new URL(url, make(base))
  else return new URL(make(url))
}

/** 构造请求体对象 */
export function makeBody(req: ARequest): BodyInit | null {
  const body: Maybe<AHttpPayload> = req.data
  if (body != null) {
    if (
      typeof body === 'object' &&
      (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body) || body instanceof ReadableStream || body instanceof URLSearchParams)
    ) {
      return body
    } else {
      switch (req.type) {
        case 'raw':
          return body as any
        case 'json':
          if (!req.headers.has('content-type')) {
            req.headers.set('content-type', 'application/json')
          }
          return JSON.stringify(body)
        case 'query':
          if (!req.headers.has('content-type')) {
            req.headers.set('content-type', 'application/x-www-form-urlencoded')
          }
          if (typeof body === 'object') {
            return buildQueryString(body)
          }
          return body
        case 'form':
          if (typeof body === 'object') {
            return buildFormData(body)
          } else {
            return new FormData()
          }
        default:
          if (typeof body === 'object') {
            if (!req.headers.has('content-type')) {
              req.headers.set('content-type', 'application/json')
            }
            return JSON.stringify(body)
          }
          return body
      }
    }
  } else {
    return null
  }
}
