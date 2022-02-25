import type { AFlow } from '../types'

/** 超时中断 */
export const timeout =
  (timeout: number): AFlow =>
  async (ctx, next) => {
    let timeoutId = setTimeout(() => ctx.abort(new AHttpTimeOutError()), timeout)
    ctx.on('abort', () => clearTimeout(timeoutId))
    try {
      return await next()
    } finally {
      clearTimeout(timeoutId)
    }
  }

/** 请求超时错误 */
export class AHttpTimeOutError extends Error {}
