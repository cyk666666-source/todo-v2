/// <reference types="vite/client" />

/** 给 import.meta.env 补类型：VITE_ 前缀的变量会进入构建产物，只放公开配置 */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
