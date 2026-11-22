# Backend

This directory contains server-side source code for Centro VIAS.

Cloudflare Pages expects the deployed Functions directory at the repository root. The source functions remain organized under `Backend/functions`; `scripts/prepare-pages.js` copies them to the root `functions` directory for local development and deployment.

```text
Backend/
├── functions/
│   ├── _lib/
│   ├── api/
│   └── _middleware.js
└── README.md
```

Run `npm run prepare:pages` before a manual Pages preview or build. The generated root `functions/` directory is ignored by Git.
