import type { Maybe } from 'libsugar/maybe'
import type { Impl, Req, Res } from './symbol'

/** 参数对象 */
export type AQueryParams = object

/** 请求发送的数据类型
 * - `json` 会将对象序列化成 json 发送
 * - `query` 将会以查询字符串形式发送
 * - `form` 将会发送一个 FormData
 * - `raw` 适用于 `string | FormData | BufferSource`| URLSearchParams`
 */
export type AReqType = 'json' | 'query' | 'form' | 'raw'

/** 请求返回的数据类型
 * - `auto` 将自动尝试返回其中的某一个
 * - `json` 按 `JSON` 格式进行解析
 * - `query` 返回 `URLSearchParams`
 * - `buffer` 返回 `ArrayBuffer`
 * - `text` 返回 `string`
 * - `blob` 返回 `Blob`
 * - `form` 返回 `FormData`
 */
export type AResType = 'auto' | 'json' | 'query' | 'buffer' | 'text' | 'blob' | 'form'

/** 请求地址 */
export type AUrl = string | URL

/** 异步 http 的请求负债 */
export type AHttpPayload = BodyInit | AQueryParams

/** 异步 http 的 http 头 */
export type AHttpHeaders = HeadersInit

/** 上下文提供 key */
export interface AContextKey<T> extends Symbol {}

/** 异步 http 的请求上下文 */
export interface AContext {
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
  set<T>(target: AResponse<T>, obj: Partial<Omit<AResponse<T>, 'type'>>): void
  /** 合并任意两个对象 */
  merge<A extends object, B extends object>(a: A, b: B): A & B
  /** 深克隆一个对象 */
  clone<T>(v: T): T
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
  /** 基础 URL，默认是当前页面 */
  base: AUrl
  /** 请求 URL */
  url: AUrl
  /** 请求的方法，默认 `post` */
  method: string
  /** 请求发送的数据类型，默认 json */
  type: AReqType
  /** 存放在 body 内的数据 */
  data?: Maybe<AHttpPayload>
  /** 从 url 传递的参数 */
  query: URLSearchParams
  /** http 头 */
  headers: Headers
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

/** 处理流水线函数，
 *
 * - 备注：当前 TS 的类型系统不允许这种情况下改变返回类型 */
export type AFlow = <T>(ctx: AContext, next: () => Promise<AResponse<T>>) => Promise<AResponse<T>>

/** 流处理器选项 */
export type AFlowOption = {
  /** 请求基础的 url， 不填的话将是当前页面的地址 */
  base?: AUrl
  /** 请求发送的数据类型，默认 json */
  type?: AReqType
  /** 存放在 body 内的数据 */
  data?: AHttpPayload
  /** 从 url 传递的参数 */
  query?: AQueryParams
  /** http 头 */
  headers?: AHttpHeaders
}

/** 处理流水线 */
export type AHttpFlow = AFlow | AFlowOption

/** 深层嵌套处理流水线 */
export type DeepAHttpFlow = AHttpFlow | DeepAHttpFlow[]

/** 中断信号 */
export interface AAbortSignal {
  on(type: 'abort', f: () => void): void
}

/** 中断信号 */
export type AHttpAbortSignal = Maybe<AbortSignal | AAbortSignal>

/** AHttp 实例链 */
export interface AHttpChain {
  /** 增加处理器 */
  use(...flows: DeepAHttpFlow[]): AHttpChain
  /** 标注是 get 请求 */
  get(): AHttpSession
  /** 标注是 post 请求 */
  post(): AHttpSession
  /** 标注是 put 请求 */
  put(): AHttpSession
  /** 标注是 delete 请求 */
  del(): AHttpSession
  /** 标注是 patch 请求 */
  patch(): AHttpSession
  /** 发送指定方法的请求 */
  send(method: string): AHttpSession
}

/** AHttp 实例会话，创建会话时尚未实际发起请求 */
export interface AHttpSession {
  /** 增加处理器 */
  use(...flows: DeepAHttpFlow[]): AHttpSession
  /** 自动推断返回类型 */
  auto<T>(): Promise<AResponse<T>>
  /** 按 `JSON` 格式解析 */
  json<T>(): Promise<AResponse<T>>
  /** 按 `URLSearchParams` 格式解析 */
  query(): Promise<AResponse<URLSearchParams>>
  /** 返回二进制数据，并解析成 `ArrayBuffer` */
  buffer(): Promise<AResponse<ArrayBuffer>>
  /** 返回纯文本 */
  text(): Promise<AResponse<string>>
  /** 返回二进制数据，并解析成 `Blob` */
  blob(): Promise<AResponse<Blob>>
  /** 按 `FormData` 格式解析  */
  form(): Promise<AResponse<FormData>>
}

/** 实现会话，实现会话是已发起请求后的 */
export interface AHttpImplSession {
  /** 自动推断返回类型 */
  auto<T>(): Promise<AHttpImplRes<T>>
  /** 按 `JSON` 格式解析 */
  json<T>(): Promise<AHttpImplRes<T>>
  /** 按 `URLSearchParams` 格式解析 */
  query(): Promise<AHttpImplRes<URLSearchParams>>
  /** 返回二进制数据，并解析成 `ArrayBuffer` */
  buffer(): Promise<AHttpImplRes<ArrayBuffer>>
  /** 返回纯文本 */
  text(): Promise<AHttpImplRes<string>>
  /** 返回二进制数据，并解析成 `Blob` */
  blob(): Promise<AHttpImplRes<Blob>>
  /** 按 `FormData` 格式解析  */
  form(): Promise<AHttpImplRes<FormData>>
}

/** 实现响应 */
export type AHttpImplRes<T> = {
  /** 原始响应对象 */
  raw: any
  /** 响应数据 */
  data: T
  /** 错误数据 */
  err?: any
  /** http 头 */
  headers: AHttpHeaders
  /** 请求是否成功 */
  ok: boolean
  /** 返回的 Http 状态码 */
  status: number
  /** 返回的 Http 状态码 文本形式 */
  statusText: string
  /** 响应的 URL */
  url: AUrl
}

/** 异步 AHttp 实现定义 */
export type AHttpImplDefine = {
  (ctx: AContext, url: URL, method: string, headers: Headers, body: BodyInit | null): Promise<AHttpImplSession>
}

/** 异步 AHttp 实现 */
export type AHttpImpl = AHttpImplDefine & {
  [Impl]: true
}
