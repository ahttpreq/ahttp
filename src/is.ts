import type { ARequest, AResponse } from './types'
import { Impl, Req, Res } from './symbol'
import { AHttpImpl } from '.'

/** 判断是否是请求对象 */
export function isReq(obj: any): obj is ARequest {
  return !!obj?.[Req]
}

/** 判断是否是响应对象 */
export function isRes<T>(obj: any): obj is AResponse<T> {
  return !!obj?.[Res]
}

/** 判断是否是实现 */
export function isImpl(obj: any): obj is AHttpImpl {
  return !!obj?.[Impl]
}