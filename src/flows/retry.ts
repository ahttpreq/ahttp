import type { AFlow } from '../types'

/** 失败重试指定的次数，最小次数 1 */
export const retry =
  (count: number): AFlow =>
  async (_ctx, next) => {
    count = Math.max(count, 1)
    for (let i = 1; ; i++) {
      if (i < count) {
        try {
          return await next()
        } catch (e) {
          console.error(e)
        }
      } else return await next()
    }
  }
