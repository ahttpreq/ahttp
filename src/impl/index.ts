import { AHttpImpl, AHttpImplDefine } from '..'
import { Impl } from '../symbol'

/** 定义实现 */
export function defineImpl(impl: AHttpImplDefine): AHttpImpl {
  ;(impl as any)[Impl] = true
  return impl as any
}
