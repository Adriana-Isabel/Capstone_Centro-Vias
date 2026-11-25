# Backend

This directory contains server-side source code for Centro VIAS.

Cloudflare Pages expects the deployed Functions directory at the repository root. The source functions remain organized under `Backend/functions`; `scripts/prepare-pages.js` copies them to the root `functions` directory for local development and deployment.

```text
Backend/
├── functions/
│   ├── _lib/
│   ├── api/
│   └── _middleware.js
├── migrations/
│   └── 0001_create_reviews.sql
└── README.md
```

Run `npm run prepare:pages` before a manual Pages preview or build. The generated root `functions/` directory is ignored by Git.

Public reviews use a Cloudflare D1 database. The local Pages script creates the
`COMMENTS_DB` binding and applies migrations from `Backend/migrations`. For
production, create a D1 database, bind it as `COMMENTS_DB` in the Pages project,
and apply the SQL migrations before deploying the review endpoints.
