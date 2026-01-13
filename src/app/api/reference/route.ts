import { ApiReference } from '@scalar/nextjs-api-reference';

const config = {
  spec: {
    url: '/api/v1/openapi.json',
  },
  theme: 'default' as const,
  hideModels: false,
  hideDownloadButton: false,
  defaultHttpClient: {
    targetKey: 'js' as const,
    clientKey: 'fetch' as const,
  },
  customCss: `
    /* Match CommissionFlow brand colors */
    .scalar-app {
      --scalar-color-1: oklch(0.208 0.042 265.755);
      --scalar-color-2: oklch(0.704 0.04 256.788);
      --scalar-color-accent: #2563eb;
      --scalar-radius: 0.625rem;
      --scalar-font: var(--font-inter, system-ui, sans-serif);
    }

    /* Gradient buttons */
    .scalar-api-client__send-button {
      background: linear-gradient(to right, #2563eb, #9333ea) !important;
      border: none !important;
    }

    .scalar-api-client__send-button:hover {
      opacity: 0.9;
    }

    /* Match card styling */
    .scalar-card {
      border-radius: 0.75rem;
      border: 1px solid oklch(0.929 0.013 255.508);
    }

    /* Dark mode support */
    .dark .scalar-app {
      --scalar-background-1: oklch(0.129 0.042 264.695);
      --scalar-background-2: oklch(0.208 0.042 265.755);
      --scalar-color-1: oklch(0.984 0.003 247.858);
      --scalar-color-2: oklch(0.85 0.04 256.788);
    }

    .dark .scalar-card {
      border-color: oklch(0.271 0.044 265.205);
      background: oklch(0.208 0.042 265.755);
    }

    /* Enhanced font readability in dark mode */
    .dark .scalar-app {
      font-weight: 400;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .dark .scalar-app h1,
    .dark .scalar-app h2,
    .dark .scalar-app h3,
    .dark .scalar-app h4 {
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .dark .scalar-app code,
    .dark .scalar-app pre {
      font-weight: 450;
    }
  `,
};

export const GET = ApiReference(config);
