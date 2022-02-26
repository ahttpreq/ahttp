export * from './types'
export * from './setting'
export * from './is'
export * from './flow'
export * from './error'
import { Box, box } from 'libsugar/box'
import type { Maybe } from 'libsugar/maybe'
import { AContextImpl, flowProcessor, makeReq } from './ctx'
import { setting } from './setting'
import type { AHttpConfig, AHttpDefaultFlow, AHttpFlow, AHttpImpl, AResponse, AUrl, FlatternAFlow, AQueryParams, SpecAHttpResType, AHttpPayload } from './types'
import { beNew, clone, flatternFlow, merge, refBox, tupleTail } from './utils'

/** 描述 AHttp 的静态实现 */
export interface AHttpStatic {
  new (defaultConfig?: Maybe<AHttpConfig>, ...defaultFlow: AHttpDefaultFlow[]): AHttp
  new (impl: AHttpImpl, defaultConfig?: Maybe<AHttpConfig>, ...defaultFlow: AHttpDefaultFlow[]): AHttp
}

/** ahttp 请求的参数 */
type ArgConfigWithFlow<R, T> = [config: AHttpConfig & R & { flow?: AHttpFlow<T>[] }, ...flow: AHttpFlow<T>[]]

/** ahttp 扩展请求的参数 */
type ArgOmitConfigWithFlow<O extends string, R, T> = [config?: Omit<AHttpConfig, 'reqType' | O> & R & { flow?: AHttpFlow<T>[] }, ...flow: AHttpFlow<T>[]]

/** AHttp 实例 */
export interface AHttp {
  /** 异步 http 请求 */
  (...args: ArgConfigWithFlow<{ resType: 'formData' }, FormData>): Promise<AResponse<FormData>>
  (...args: ArgConfigWithFlow<{ resType: 'blob' }, Blob>): Promise<AResponse<Blob>>
  (...args: ArgConfigWithFlow<{ resType: 'text' }, string>): Promise<AResponse<string>>
  (...args: ArgConfigWithFlow<{ resType: 'arraybuffer' }, ArrayBuffer>): Promise<AResponse<ArrayBuffer>>
  <T>(...args: ArgConfigWithFlow<SpecAHttpResType<T>, T>): Promise<AResponse<T>>

  /** 异步 get 请求 */
  get(url: AUrl, query?: AQueryParams, ...args: ArgOmitConfigWithFlow<'query', { resType: 'formData' }, FormData>): Promise<AResponse<FormData>>
  get(url: AUrl, query?: AQueryParams, ...args: ArgOmitConfigWithFlow<'query', { resType: 'blob' }, Blob>): Promise<AResponse<Blob>>
  get(url: AUrl, query?: AQueryParams, ...args: ArgOmitConfigWithFlow<'query', { resType: 'text' }, string>): Promise<AResponse<string>>
  get(url: AUrl, query?: AQueryParams, ...args: ArgOmitConfigWithFlow<'query', { resType: 'arraybuffer' }, ArrayBuffer>): Promise<AResponse<ArrayBuffer>>
  get<T>(url: AUrl, query?: AQueryParams, ...args: ArgOmitConfigWithFlow<'query', SpecAHttpResType<T>, T>): Promise<AResponse<T>>

  /** 异步 post 请求 */
  post(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'formData' }, FormData>): Promise<AResponse<FormData>>
  post(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'blob' }, Blob>): Promise<AResponse<Blob>>
  post(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'text' }, string>): Promise<AResponse<string>>
  post(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'arraybuffer' }, ArrayBuffer>): Promise<AResponse<ArrayBuffer>>
  post<T>(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', SpecAHttpResType<T>, T>): Promise<AResponse<T>>

  /** 异步 put 请求 */
  put(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'formData' }, FormData>): Promise<AResponse<FormData>>
  put(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'blob' }, Blob>): Promise<AResponse<Blob>>
  put(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'text' }, string>): Promise<AResponse<string>>
  put(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'arraybuffer' }, ArrayBuffer>): Promise<AResponse<ArrayBuffer>>
  put<T>(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', SpecAHttpResType<T>, T>): Promise<AResponse<T>>

  /** 异步 delete 请求 */
  del(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'formData' }, FormData>): Promise<AResponse<FormData>>
  del(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'blob' }, Blob>): Promise<AResponse<Blob>>
  del(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'text' }, string>): Promise<AResponse<string>>
  del(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'arraybuffer' }, ArrayBuffer>): Promise<AResponse<ArrayBuffer>>
  del<T>(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', SpecAHttpResType<T>, T>): Promise<AResponse<T>>

  /** 异步 patch 请求 */
  patch(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'formData' }, FormData>): Promise<AResponse<FormData>>
  patch(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'blob' }, Blob>): Promise<AResponse<Blob>>
  patch(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'text' }, string>): Promise<AResponse<string>>
  patch(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', { resType: 'arraybuffer' }, ArrayBuffer>): Promise<AResponse<ArrayBuffer>>
  patch<T>(url: AUrl, data?: AHttpPayload, ...args: ArgOmitConfigWithFlow<'data', SpecAHttpResType<T>, T>): Promise<AResponse<T>>
}

/** 构造新的异步 http 请求实例*/
export const AHttp: AHttpStatic = beNew(function (a: any, ...args: any): AHttp {
  const impl: Box<AHttpImpl> = typeof a === 'function' ? box(a) : refBox(() => setting.impl)
  const defaultConfig: Maybe<AHttpConfig> = typeof a === 'function' ? args[0] : a
  const defaultFlow: AHttpDefaultFlow[] = typeof a === 'function' ? tupleTail(args) : args
  const ahttp: AHttp = async function ahttp<T>(instConfig: AHttpConfig & { flow?: AHttpFlow<T>[] }, ...insFlow: AHttpFlow<T>[]): Promise<AResponse<T>> {
    const config: AHttpConfig = merge.recursive(clone(defaultConfig ?? {}), instConfig)
    const flow: FlatternAFlow<T>[] = [...flatternFlow<T>(...defaultFlow, ...(instConfig?.flow ?? []), ...insFlow)]
    const ctx = new AContextImpl<T>(config, makeReq(config))
    const res = await flowProcessor(flow, ctx, impl, config.resType ?? 'auto')
    return res
  }
  ahttp.get = async function get(url: AUrl, query?: AQueryParams, config?: any, ...flow: AHttpFlow<any>[]): Promise<any> {
    return await ahttp({ ...config, method: 'get', url, query }, ...flow)
  }
  ahttp.post = async function post(url: AUrl, data?: AHttpPayload, config?: any, ...flow: AHttpFlow<any>[]): Promise<any> {
    return await ahttp({ ...config, method: 'post', url, data }, ...flow)
  }
  ahttp.put = async function post(url: AUrl, data?: AHttpPayload, config?: any, ...flow: AHttpFlow<any>[]): Promise<any> {
    return await ahttp({ ...config, method: 'put', url, data }, ...flow)
  }
  ahttp.del = async function post(url: AUrl, data?: AHttpPayload, config?: any, ...flow: AHttpFlow<any>[]): Promise<any> {
    return await ahttp({ ...config, method: 'delete', url, data }, ...flow)
  }
  ahttp.patch = async function post(url: AUrl, data?: AHttpPayload, config?: any, ...flow: AHttpFlow<any>[]): Promise<any> {
    return await ahttp({ ...config, method: 'patch', url, data }, ...flow)
  }
  return ahttp
})

/** 异步 http 请求 */
export const ahttp = new AHttp()

/** 异步 get 请求 */
export const aget = ahttp.get

/** 异步 post 请求 */
export const apost = ahttp.post

/** 异步 put 请求 */
export const aput = ahttp.put

/** 异步 delete 请求 */
export const adel = ahttp.del

/** 异步 patch 请求 */
export const apatch = ahttp.patch
