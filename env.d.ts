/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string
  readonly VITE_API_URL: string
  readonly VITE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'vue-auth3/dist/chunk-QALVUXMO.mjs' {
  export function defineAuthDriver(config: any): any
}

declare module 'vue-auth3/dist/chunk-3BTIPVYA.mjs' {
  export function defineHttpDriver(config: any): any
}