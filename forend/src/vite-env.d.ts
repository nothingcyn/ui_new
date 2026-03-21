/// <reference types="vite/client" />

export interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 其他环境变量...
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
interface ImportMetaEnv {
  readonly VITE_ALIYUN_CAPTCHA_APP_ID: string
  // 以后有其他的环境变量也可以写在这里
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}