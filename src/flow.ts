import { box, Box } from 'libsugar/box'
import { AContextImpl } from './ctx'
import { makeAResponse, makeBody, makeURL, tryURL } from './struct'
import { AFlowOption, AHttpFlow, AHttpImpl, AHttpImplRes, AHttpImplSession, ARequest, AResponse, AResType } from './types'
import { appendQueryString, mergeHeaders } from './utils'

/** 处理流的选项 */
function setFlowOption(req: ARequest, flow: AFlowOption) {
  if (flow.base) req.base = flow.base
  if (flow.data) req.data = flow.data
  if (flow.headers) mergeHeaders(req.headers, flow.headers)
  if (flow.query) appendQueryString(req.query, flow.query)
  if (flow.type) req.type = flow.type
}

/** 流处理器 */
export async function flowProcessor<T>(flows: AHttpFlow[], ctx: AContextImpl, impl: Box<AHttpImpl>, type: AResType): Promise<AResponse<T>> {
  const urlOut = box<URL>(null!)
  return await process(0)
  async function process(index: number): Promise<AResponse<T>> {
    const flow = flows[index]
    if (!flow) {
      const session = await callImpl(ctx, impl.val, urlOut)
      const res = await session[type]()
      return makeAResponse(type, res.data, res.err, new Headers(res.headers), res.ok, res.status, res.statusText, tryURL(res.url) ?? urlOut.val)
    }
    if (typeof flow === 'function') {
      return await flow(ctx._make_stack(index), next)
    } else {
      setFlowOption(ctx.req, flow)
      return await next()
    }
    async function next(): Promise<AResponse<T>> {
      if (ctx._aborted) throw ctx._abortReason
      return await process(index + 1)
    }
  }
}

/** 最终调用请求实现 */
export async function callImpl(ctx: AContextImpl, impl: AHttpImpl, urlOut: Box<URL>) {
  const req = ctx.req
  const url = makeURL(req.url, req.base)
  if (req.query != null) {
    appendQueryString(url.searchParams, req.query)
  }
  urlOut.val = url
  const method = req.method
  const headers = req.headers
  const body = makeBody(req)
  return await impl(ctx, url, method, headers, body)
}
