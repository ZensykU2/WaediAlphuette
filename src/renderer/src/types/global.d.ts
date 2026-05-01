import { WaediApi } from './index'

declare global {
  interface Window {
    api: WaediApi
    electron: any
  }
}

export {}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}
