/// <reference types="vite/client" />

declare module '*.css' {
  const css: { default: string };
  export default css;
}

declare module '*.css?inline' {
  const css: string;
  export default css;
}
