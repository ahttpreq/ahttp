import { FetchImpl } from './impl/fetch'
import { AHttpImpl } from './types'

export interface AHttpSetting {
  impl: AHttpImpl
}

export const setting: AHttpSetting = {
  impl: FetchImpl,
}
