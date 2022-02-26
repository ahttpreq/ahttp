import type { Maybe } from 'libsugar/maybe'
import type { Req, Res } from './reqres'

/** 参数对象 */
export type AQueryParams = object

/** 请求发送的数据类型
 * - `json` 会将对象序列化成 json 发送
 * - `query` 将会以查询字符串形式发送
 * - `form` 将会发送一个 FormData
 * - `raw` 适用于 `string | FormData | BufferSource`| URLSearchParams`
 */
export type AReqType = 'json' | 'query' | 'form' | 'raw'

/** 请求返回的数据类型, `auto` 将自动尝试返回其中的某一个， */
export type AResType = 'auto' | 'json' | 'query' | 'arraybuffer' | 'text' | 'blob' | 'formData'

/** 请求地址 */
export type AUrl = string | URL

/** 异步 http 的请求负债 */
export type AHttpPayload = BodyInit | AQueryParams

/** 异步 http 的 http 头 */
export type AHttpHeaders = HeadersInit

/** 上下文提供 key */
export interface AContextKey<T> extends Symbol {}

/** 异步 http 的请求上下文 */
export interface AContext<T> {
  /** 配置选项 */
  config: AHttpConfig
  /** 请求 */
  req: ARequest
  /** 提供上下文数据，提供的数据被附加到指定对象，并且会一直存在 */
  provide<T>(target: any, key: AContextKey<T> | string | number, value: T): void
  /** 提供上下文数据，提供的数据只能在后续处理器中获取 */
  provide<T>(key: AContextKey<T> | string | number, value: T): void
  /** 取出依附在指定对象上的上下文数据 */
  use<T>(target: any, key: AContextKey<T> | string): T | undefined
  /** 取出上下文数据 */
  use<T>(key: AContextKey<T> | string): T | undefined
  /** 批量设置请求数据 */
  set(target: ARequest, obj: Partial<ARequest>): void
  /** 批量设置响应数据 */
  set(target: AResponse<T>, obj: Partial<Omit<AResponse<T>, 'type'>>): void
  /** 产生错误，中断后续处理器，将调用 abort，返回一个失败的 Promise */
  err(err?: any): Promise<never>
  /** 中断后续处理器，可选提供一个错误，返回一个永远不会结束的 Promise，并使 next 永远不会结束，将忽略多次调用 */
  abort(err?: any): Promise<never>
  /** 注册中断事件 */
  on(key: 'abort', f: (err?: any) => void): void
  /** 取消注册中断事件 */
  off(key: 'abort', f: (err?: any) => void): void
}

/** 异步 http 的请求实例 */
export interface ARequest {
  [Req]: true
  /** 请求 URL */
  url: URL
  /** 请求的方法，默认 `post` */
  method: string
  /** 请求发送的数据类型，默认 json */
  type: AReqType
  /** 存放在 body 内的数据 */
  data?: AHttpPayload
  /** 从 url 传递的参数 */
  query: URLSearchParams
  /** http 头 */
  headers: Headers
  /** 通知中断请求的信号 */
  signal?: Maybe<AHttpAbortSignal[]> // TODO 暂未处理
}

/** 异步 http 的响应实例 */
export interface AResponse<T> {
  [Res]: true
  /** 请求返回的数据类型 */
  readonly type: AResType
  /** 响应数据 */
  data: T
  /** 错误数据 */
  err?: any
  /** http 头 */
  headers: Headers
  /** 请求是否成功 */
  ok: boolean
  /** 返回的 Http 状态码 */
  status: number
  /** 返回的 Http 状态码 文本形式 */
  statusText: string
  /** 响应的 URL */
  url: URL
}

/** AHttp 实现的返回值 */
export type AHttpImplRes<T> = Promise<{
  /** 响应数据 */
  data: T
  /** 错误数据 */
  err?: any
  /** http 头 */
  headers: Headers
  /** 请求是否成功 */
  ok: boolean
  /** 返回的 Http 状态码 */
  status: number
  /** 返回的 Http 状态码 文本形式 */
  statusText: string
  /** 响应的 URL */
  url: URL
}>

/** AHttp 实现
 *
 * - 实现无需处理 signal，注册 ctx 中的 abort 即可 */
export type AHttpImpl = <T>(ctx: AContext<T>, body: any, req: ARequest, type: AResType) => AHttpImplRes<T>

/** 处理流水线函数 */
export type AFlow = <T>(ctx: AContext<T>, next: () => Promise<AResponse<T>>) => Promise<AResponse<T>>

/** 处理流水线上的直接覆盖选项 */
export interface AFlowMergeConfig {
  /** 请求的 url， 不填的话将是当前页面的地址 */
  url?: AUrl
  /** 请求的方法，默认 `post` */
  method?: string
  /** 请求发送的数据类型，默认 json */
  type: AReqType
  /** 存放在 body 内的数据 */
  data?: AHttpPayload
  /** 从 url 传递的参数 */
  query?: AQueryParams
  /** http 头 */
  headers?: AHttpHeaders
  /** 通知中断请求的信号 */
  signal?: Maybe<AHttpAbortSignal[]>
}

/** 扁平的处理流水线 */
export type FlatternAFlow<T> = ((ctx: AContext<T>, next: () => Promise<AResponse<T>>) => Promise<AResponse<T>>) | AFlowMergeConfig

/** 扁平的处理流水线 */
export type FlatternDefaultAFlow = AFlow | AFlowMergeConfig

/** 处理流水线 */
export type AHttpFlow<T> = FlatternAFlow<T> | AHttpFlow<T>[]

/** 处理流水线 */
export type AHttpDefaultFlow = FlatternDefaultAFlow | AHttpDefaultFlow[]

/** 中断信号 */
export interface AAbortSignal {
  on(type: 'abort', f: () => void): void
}

/** 中断信号 */
export type AHttpAbortSignal = Maybe<AbortSignal | AAbortSignal>

/** 异步 http 请求的基础配置选项 */
export interface AHttpBasicConfig {
  /** 请求的 url， 不填的话将是当前页面的地址 */
  url?: AUrl
  /** 基础 URL */
  base?: AUrl
  /** 请求的方法，默认 `post` */
  method?: string
  /** 请求发送的数据类型，默认 json */
  reqType?: AReqType
  /** 存放在 body 内的数据 */
  data?: AHttpPayload
  /** 从 url 传递的参数 */
  query?: AQueryParams
  /** http 头 */
  headers?: AHttpHeaders
  /** 通知中断请求的信号 */
  signal?: Maybe<AHttpAbortSignal[]>
}

/** 异步 http 请求的配置选项 */
export interface AHttpConfig extends AHttpBasicConfig {
  /** 请求返回的数据类型，默认 json */
  resType?: AResType
}

/** 特殊响应返回值 */
export type SpecAHttpRes = FormData | Blob | ArrayBuffer

/** 特殊响应返回值映射 */
type SpecAHttpResTypeMap = [FormData, 'formData'] | [Blob, 'blob'] | [ArrayBuffer, 'arraybuffer']

/** 特化响应返回值对象 */
export type SpecAHttpResType<T> = T extends SpecAHttpRes ? { resType: Extract<SpecAHttpResTypeMap, [T, any]>[1] } : { resType?: 'json' }
