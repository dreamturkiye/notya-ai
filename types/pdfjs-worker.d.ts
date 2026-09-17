// core/lab/cikarim.ts loads the pdfjs worker in-process on the server (no bundled .d.ts for the worker entry).
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: unknown
}
