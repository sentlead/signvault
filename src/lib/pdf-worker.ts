/**
 * lib/pdf-worker.ts
 *
 * Configures the PDF.js background worker for react-pdf.
 *
 * react-pdf uses PDF.js under the hood to parse and render PDFs.
 * PDF.js offloads heavy parsing work to a Web Worker so the main
 * thread doesn't freeze. We point it at the pre-built worker file
 * that we've copied into /public/pdf.worker.min.mjs.
 *
 * IMPORTANT: This module must be imported once before you render
 * any <Document> or <Page> component from react-pdf.
 */

import { pdfjs } from 'react-pdf'

// Point the worker at the exact same version that react-pdf bundles internally.
// Using the CDN URL with pdfjs.version guarantees they always match — no more
// "API version does not match Worker version" errors.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
