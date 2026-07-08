declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
  }
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
