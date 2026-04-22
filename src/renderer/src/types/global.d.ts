import { WaediApi } from './index'

declare global {
  interface Window {
    api: WaediApi
    electron: any
  }
}

export {}
