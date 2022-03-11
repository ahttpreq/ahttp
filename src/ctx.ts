import { TEvent } from 'libsugar/event'
import { abort } from 'libsugar/fn'
import { Req, Res } from './symbol'
import type { AContext, AContextKey, ARequest, AResponse } from './types'
import { appendQueryString, clone, lazyErr, merge, mergeHeaders } from './utils'

/** 上下文实现
 *
 * - 不使用私有一方面是藏在接口后面没必要，一方面是方便哪个闲着蛋疼的搞骚操作
 */
export class AContextImpl implements AContext {
  constructor(public req: ARequest) {}

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
  use<T>(target: any, key?: any, /** 注入当前栈位置 */ _stack_index?: number, /** 注入参数长度 */ _arg_len?: number): T | T | undefined {
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
  set<T>(target: ARequest, obj: Partial<Omit<ARequest, typeof Req>>): void
  set<T>(target: AResponse<T>, obj: Partial<Omit<AResponse<T>, 'type' | typeof Res>>): void
  set<T>(target: any, obj: any): void {
    if (target?.[Req]) {
      setReq(target, obj)
    } else if (target?.[Res]) {
      setRes<T>(target, obj)
    }
  }

  merge<A extends object, B extends object>(a: A, b: B): A & B {
    return merge(a, b)
  }
  
  clone<T>(v: T): T {
    return clone(v)
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

/** 设置请求对象 */
function setReq(target: ARequest, obj: Partial<Omit<ARequest, typeof Req>>) {
  if (obj.base != null) target.base = obj.base
  if (obj.data != null) target.data = obj.data
  if (obj.headers != null) mergeHeaders(target.headers, obj.headers)
  if (obj.method != null) target.method = obj.method
  if (obj.query != null) appendQueryString(target.query, obj.query)
  if (obj.type != null) target.type = obj.type
  if (obj.url != null) target.url = obj.url
}

/** 设置响应对象 */
function setRes<T>(target: AResponse<T>, obj: Partial<Omit<AResponse<T>, 'type' | typeof Res>>) {
  if (obj.data != null) target.data = obj.data
  if (obj.err != null) target.err = obj.err
  if (obj.headers != null) mergeHeaders(target.headers, obj.headers)
  if (obj.ok != null) target.ok = obj.ok
  if (obj.status != null) target.status = obj.status
  if (obj.statusText != null) target.statusText = obj.statusText
  if (obj.url != null) target.url = obj.url
}
