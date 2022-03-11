import { Box } from 'libsugar/box'
import { AContextImpl } from './ctx'
import { flowProcessor } from './flow'
import { makeARequest } from './struct'
import { AResType, AUrl, AHttpChain, AHttpImpl, AHttpSession, AResponse, DeepAHttpFlow } from './types'
import { flatternFlow } from './utils'

export class AHttpChainImpl implements AHttpChain {
  constructor(public impl: Box<AHttpImpl>, public url: AUrl, public flows: DeepAHttpFlow) {}

  use(...flows: DeepAHttpFlow[]): AHttpChain {
    return new AHttpChainImpl(this.impl, this.url, [this.flows, flows])
  }
  get(): AHttpSession {
    return this.send('get')
  }
  post(): AHttpSession {
    return this.send('post')
  }
  put(): AHttpSession {
    return this.send('put')
  }
  del(): AHttpSession {
    return this.send('del')
  }
  patch(): AHttpSession {
    return this.send('patch')
  }
  send(method: string): AHttpSession {
    return new AHttpSessionImpl(this.impl, this.url, this.flows, method)
  }
}

export class AHttpSessionImpl implements AHttpSession {
  constructor(public impl: Box<AHttpImpl>, public url: AUrl, public flows: DeepAHttpFlow, public method: string) {}

  async auto<T>(): Promise<AResponse<T>> {
    return await sessionSend(this, 'auto')
  }
  async json<T>(): Promise<AResponse<T>> {
    return await sessionSend(this, 'json')
  }
  async query(): Promise<AResponse<URLSearchParams>> {
    return await sessionSend(this, 'query')
  }
  async buffer(): Promise<AResponse<ArrayBuffer>> {
    return await sessionSend(this, 'buffer')
  }
  async text(): Promise<AResponse<string>> {
    return await sessionSend(this, 'text')
  }
  async blob(): Promise<AResponse<Blob>> {
    return await sessionSend(this, 'blob')
  }
  async form(): Promise<AResponse<FormData>> {
    return await sessionSend(this, 'form')
  }
}

async function sessionSend<T>(self: AHttpSessionImpl, type: AResType): Promise<AResponse<T>> {
  const flows = [...flatternFlow(self.flows)]
  const req = makeARequest(location.href, self.url, self.method, 'json', null, new URLSearchParams(), new Headers())
  const ctx = new AContextImpl(req)
  return await flowProcessor<T>(flows, ctx, self.impl, type)
}
