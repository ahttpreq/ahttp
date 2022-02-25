import type { ARequest, AResponse } from './types'
import { Req, Res } from './reqres'

/** 判断是否是请求对象 */
export function isReq(obj: any): obj is ARequest {
  return !!obj?.[Req]
}

/** 判断是否是响应对象 */
export function isRes<T>(obj: any): obj is AResponse<T> {
  return !!obj?.[Res]
}
