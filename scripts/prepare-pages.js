const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const source = path.join(repositoryRoot, 'Backend', 'functions');
const destination = path.join(repositoryRoot, 'functions');

if (!fs.existsSync(source)) {
  throw new Error(`Pages Functions source directory not found: ${source}`);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });

console.log('Prepared Cloudflare Pages Functions at /functions');
