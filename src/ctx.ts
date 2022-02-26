import { TEvent } from 'libsugar/event'
import { Box } from 'libsugar/box'
import { abort } from 'libsugar/fn'
import { Req, Res } from './reqres'
import type { AContext, AContextKey, AFlowMergeConfig, AHttpConfig, AHttpImpl, ARequest, AResponse, AResType, FlatternAFlow } from './types'
import { appendQueryString, buildFormData, buildQueryString, lazyErr, makeURL, merge, mergeHeaders, WithOnce } from './utils'

/** 创建请求对象 */
export function makeReq(config: AHttpConfig): ARequest {
  // 备注：数据对象不该有原型，所以使用对象字面量
  return {
    [Req]: true,
    url: makeURL(config.url ?? location.href, config.base),
    method: config.method ?? 'post',
    type: config.reqType ?? 'json',
    data: config.data,
    query: buildQueryString(config.query ?? {}),
    headers: new Headers(config.headers),
  }
}

/** 合并请求对象 */
export function flowMergeReq(req: ARequest, config: AFlowMergeConfig): ARequest {
  if (!config) return req
  if (config.url) req.url = makeURL(config.url, req.url)
  if (config.method) req.method = config.method
  if (config.type) req.type = config.type
  if (config.data) req.data = config.data
  if (config.query) appendQueryString(req.query, config.query)
  if (config.headers) mergeHeaders(req.headers, config.headers)
  if (config.signal) req.signal = req.signal ? req.signal.concat(config.signal) : config.signal
  return req
}

/** 合并请求对象 */
export function mergeReq(req: ARequest, obj: ARequest): ARequest {
  if (!obj) return req
  if (obj.url) req.url = makeURL(obj.url, req.url)
  if (obj.method) req.method = obj.method
  if (obj.type) req.type = obj.type
  if (obj.data) req.data = obj.data
  if (obj.query) appendQueryString(req.query, obj.query)
  if (obj.headers) mergeHeaders(req.headers, obj.headers)
  if (obj.signal) req.signal = req.signal ? req.signal.concat(obj.signal) : obj.signal
  return req
}

/** 合并响应对象 */
export function mergeRes<T>(res: AResponse<T>, obj: AResponse<T>): AResponse<T> {
  if (!obj) return res
  if (obj.data) res.data = obj.data
  if (obj.headers) mergeHeaders(res.headers, obj.headers)
  if (obj.ok) res.ok = obj.ok
  if (obj.status) res.status = obj.status
  if (obj.statusText) res.statusText = obj.statusText
  if (obj.url) res.url = makeURL(obj.url, res.url)
  return res
}

/** 上下文实现
 *
 * - 不使用私有一方面是藏在接口后面没必要，一方面是方便哪个闲着蛋疼的搞骚操作
 */
export class AContextImpl<T> implements AContext<T> {
  constructor(public config: AHttpConfig, public req: ARequest) {}

  /** 中断事件 */
  _abortEvent?: TEvent<any> = new TEvent<any>()
  /** 是否已中断 */
  _aborted = false
  /** 中断理由 */
  _abortReason?: any

  /** 上下文栈 */
  _stack: Map<any, any>[] = []
  /** 上下文存储 */
  _storage = new WeakMap<any, Map<any, any>>()

  /** 创建注入了栈位置的上下文 */
  _make_stack(index: number) {
    const impls = new WeakMap()
    return new Proxy(this, {
      get(target, p, receiver) {
        const r = Reflect.get(target, p, receiver)
        if (typeof r !== 'function') return r
        if (p === 'provide') {
          let impl = impls.get(r)
          if (!impl) {
            impl = new Proxy(r, {
              apply(target, thisArg, argArray) {
                const len = Math.min(argArray.length, 3)
                argArray[3] = index
                argArray[4] = len
                return Reflect.apply(target, thisArg, argArray)
              },
            })
            impls.set(r, impl)
          }
          return impl
        } else if (p === 'use') {
          let impl = impls.get(r)
          if (!impl) {
            impl = new Proxy(r, {
              apply(target, thisArg, argArray) {
                const len = Math.min(argArray.length, 2)
                argArray[2] = index
                argArray[3] = len
                return Reflect.apply(target, thisArg, argArray)
              },
            })
            impls.set(r, impl)
          }
          return impl
        }
        return r
      },
    })
  }

  provide<T>(target: any, key: string | number | AContextKey<T>, value: T): void
  provide<T>(key: string | number | AContextKey<T>, value: T): void
  provide(target: any, key: any, value?: any, /** 注入当前栈位置 */ _stack_index?: number, /** 注入参数长度 */ _arg_len?: number): void {
    if (_arg_len ?? Math.min(arguments.length, 3) <= 2) {
      value = key
      key = target
      target = _stack_index == null ? this : null
    }
    let storage
    if (target != null) {
      storage = this._storage.get(target)
      if (!storage) {
        storage = new Map()
        this._storage.set(target, storage)
      }
    } else {
      storage = this._stack[_stack_index!]
      if (!storage) {
        storage = new Map()
        this._stack[_stack_index!] = storage
      }
    }
    storage.set(key, value)
  }
  use<T>(target: any, key: string | AContextKey<T>): T | undefined
  use<T>(key: string | AContextKey<T>): T | undefined
  use(target: any, key?: any, /** 注入当前栈位置 */ _stack_index?: number, /** 注入参数长度 */ _arg_len?: number): T | T | undefined {
    if (_arg_len ?? Math.min(arguments.length, 2) <= 1) {
      key = target
      target = _stack_index == null ? this : null
    }
    if (target != null) {
      let storage = this._storage.get(target)
      if (!storage) {
        storage = new Map()
        this._storage.set(target, storage)
      }
      return storage.get(key)
    } else {
      for (let i = Math.min(_stack_index!, this._stack.length); i >= 0; i--) {
        const storage = this._stack[i]
        if (!storage) continue
        if (storage.has(key)) return storage.get(key)
      }
      return
    }
  }
  set(target: ARequest, obj: Partial<ARequest>): void
  set(target: AResponse<T>, obj: Partial<Omit<AResponse<T>, 'type'>>): void
  set(target: any, obj: any): void {
    if (target?.[Req]) {
      mergeReq(target, obj)
    } else if (target?.[Res]) {
      mergeRes(target, obj)
    }
  }
  err(err: any): Promise<never> {
    this.abort(err)
    return lazyErr(err)
  }
  abort(err?: any): Promise<never> {
    if (this._aborted) return abort()
    this._aborted = true
    this._abortEvent?.emit(err)
    this._abortEvent = void 0
    return abort()
  }
  on(key: 'abort', f: (...args: any[]) => void): void {
    if (key == 'abort') this._abortEvent?.once(f)
  }
  off(key: 'abort', f: (err?: any) => void): void {
    if (key == 'abort') this._abortEvent?.off(f)
  }
}

/** 流处理器 */
export async function flowProcessor<T>(flows: FlatternAFlow<T>[], ctx: AContextImpl<T>, impl: Box<AHttpImpl>, resType: AResType): Promise<AResponse<T>> {
  return await process(0)
  async function process(index: number): Promise<AResponse<T>> {
    const flow = flows[index]
    if (!flow) return await callImpl(ctx, impl.val, resType)
    if (typeof flow === 'function') {
      return await flow(ctx._make_stack(index), next)
    } else {
      flowMergeReq(ctx.req, flow)
      return await next()
    }
    async function next(): Promise<AResponse<T>> {
      if (ctx._aborted) throw ctx._abortReason
      return await process(index + 1)
    }
  }
}

/** 最终调用请求实现 */
export async function callImpl<T>(ctx: AContextImpl<T>, impl: AHttpImpl, resType: AResType): Promise<AResponse<T>> {
  let body = ctx.req.data
  const reqType = ctx.req.type
  if (body != null) {
    do {
      if (
        typeof body === 'object' &&
        (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body) || body instanceof ReadableStream || body instanceof URLSearchParams)
      ) {
        break
      } else {
        switch (reqType) {
          case 'json':
            if (!ctx.req.headers.has('content-type')) {
              ctx.req.headers.set('content-type', 'application/json')
            }
            body = JSON.stringify(body)
            break
          case 'query':
            if (!ctx.req.headers.has('content-type')) {
              ctx.req.headers.set('content-type', 'application/x-www-form-urlencoded')
            }
            if (typeof body === 'object') {
              body = buildQueryString(body)
            }
            break
          case 'form':
            if (typeof body === 'object') {
              body = buildFormData(body)
            } else {
              body = new FormData()
            }
        }
      }
    } while (false)
  }
  if (ctx.req.query != null) {
    appendQueryString(ctx.req.url.searchParams, ctx.req.query)
  }
  for (const signal of ctx.req.signal ?? []) {
    if (typeof signal !== 'object' || signal == null) continue
    if ('on' in signal) signal?.on('abort', () => ctx.abort())
    else signal?.addEventListener('abort', () => ctx.abort())
  }
  const res: any = await impl(ctx, body, ctx.req, resType)
  res[Res] = true
  res.type = resType
  return res
}
