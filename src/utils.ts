import { used } from 'libsugar/effect'
import { pipe } from 'libsugar/pipe'
import { filter, map } from 'libsugar/seq/fp'
import { TupleTail } from 'libsugar/types'
import type { AHttpFlow, AQueryParams } from './types'
import rfdc from 'rfdc'
import { Box } from 'libsugar/box'
import { DeepAHttpFlow } from '.'
export { default as merge } from 'merge'

/** 深度复制对象 */
export const clone = rfdc({ proto: false, circles: false })

/** 强制断言可new */
export function beNew<F extends (...args: any) => object>(f: F): new (...args: Parameters<F>) => ReturnType<F> {
  return f as any
}

/** 获取元组的剩余元素 */
export function tupleTail<T extends any[]>([, ...t]: T): TupleTail<T> {
  return t as any
}

/** 返回查询字符串迭代器 */
export function queryIter(params: AQueryParams): Iterable<[string, any]> {
  return params instanceof URLSearchParams ? params : Object.entries(params)
}

/** 构建表单数据对象 */
export function buildFormData(params: AQueryParams): FormData {
  const fd = new FormData()
  for (const [k, v] of queryIter(params)) {
    switch (typeof v) {
      case 'bigint':
      case 'boolean':
      case 'number':
        fd.append(k, `${v}`)
        break
      case 'string':
        fd.append(k, v)
        break
      case 'undefined':
        break
      case 'object':
        if (v == null) break
        else if (v instanceof Date) fd.append(k, v.toString())
        else if (v instanceof File) fd.append(k, v, v.name)
        else if (v instanceof Blob) fd.append(k, v)
        else fd.append(k, JSON.stringify(v))
    }
  }
  return fd
}

/** 构建查询字符串迭代器 */
export const buildQueryStringIter = pipe(
  (params: AQueryParams) => queryIter(params),
  map(([k, v]) => [
    k,
    used(v, v => {
      switch (typeof v) {
        case 'bigint':
        case 'boolean':
        case 'number':
          return `${v}`
        case 'string':
          return v
        case 'undefined':
          return ''
        case 'object':
          if (v == null) return ''
          else if (v instanceof Date) return v.toJSON()
          else return JSON.stringify(v)
        default:
          return ''
      }
    }),
  ]),
  filter(([k, v]) => k != null && k != '' && v != null)
)

/** 构建URL搜索参数对象 */
export function buildQueryString(params: AQueryParams) {
  return appendQueryString(new URLSearchParams(), params)
}

/** 在现有的URL搜索参数对象上追加 */
export function appendQueryString(query: URLSearchParams, params: AQueryParams) {
  for (const [k, v] of buildQueryStringIter(params)) {
    query.append(k, v)
  }
  return query
}

/** 合并标头 */
export function mergeHeaders(a: Headers, b: HeadersInit) {
  b = new Headers(b)
  for (const [key, value] of b) {
    a.append(key, value)
  }
  return a
}

/** 拍平流水线 */
export function* flatternFlow(flow: DeepAHttpFlow): Iterable<AHttpFlow> {
  if (flow instanceof Array) {
    for (const item of flow) {
      yield* flatternFlow(item)
    }
  } else {
    yield flow
  }
}

/** 惰性的报错，实际使用才会报错的 Promise */
export function lazyErr(err: any): Promise<never> {
  let ep: Promise<never>
  return {
    then(...args: any[]) {
      if (!ep) ep = Promise.reject(err)
      return ep.then(...args)
    },
    catch(...args: any) {
      if (!ep) ep = Promise.reject(err)
      return ep.catch(...args)
    },
    finally(...args: any) {
      if (!ep) ep = Promise.reject(err)
      return ep.finally(...args)
    },
    __proto__: Promise.prototype,
  } as any
}

/** 引用 box */
export function refBox<T>(getter: () => T): Box<T> {
  return {
    get val() {
      return getter()
    },
  }
}
