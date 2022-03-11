export * from './types'
export * from './setting'
export * from './is'
export * from './flows'
export * from './error'
export * from './impl'
import { box } from 'libsugar/box'
import { AHttpChainImpl } from './chain'
import { isImpl } from './is'
import { setting } from './setting'
import type { AUrl, AHttpImpl, AHttpChain, DeepAHttpFlow } from './types'
import { beNew, refBox, tupleTail } from './utils'

/** 描述 AHttp 的静态实现 */
export interface AHttpStatic {
  new (...flows: DeepAHttpFlow[]): AHttp
  new (impl: AHttpImpl, ...flows: DeepAHttpFlow[]): AHttp
}

/** AHttp 实例 */
export interface AHttp {
  /** @param url 请求的 URL */
  (url: AUrl): AHttpChain
}

/** 构造新的异步 http 请求实例*/
export const AHttp: AHttpStatic = beNew(function (...args: any): AHttp {
  const impl = isImpl(args[0]) ? box(args[0]) : refBox(() => setting.impl)
  const staticFlows: DeepAHttpFlow = isImpl(args[0]) ? tupleTail(args) : args
  return url => new AHttpChainImpl(impl, url, staticFlows)
})

/** 异步 http 请求 */
export const ahttp = new AHttp()
