# Centro VIAS administrator authentication

This implementation uses Cloudflare Pages Functions and a Workers KV namespace. It does not use frontend-only authentication or credentials stored in the repository.

## Files created or modified

- `Frontend/Admin-Login/Admin-Login.html`: preserves the existing login interface and changes the login control into a real form with accessible error output.
- `Frontend/Admin-Login/Admin-Login.js`: submits JSON credentials to `/api/login`, shows server errors, and redirects to the dashboard after success.
- `Frontend/Admin-Login/dashboard.html`: protected administrator landing page.
- `Frontend/Admin-Login/dashboard.js`: verifies the server session and submits logout.
- `Backend/functions/_middleware.js`: protects administrator HTML and `/api/*` endpoints except login and logout.
- `Backend/functions/_lib/auth.js`: cookie, session, constant-time comparison, and PBKDF2-SHA-256 helpers.
- `Backend/functions/api/login.js`: verifies `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`, creates KV-backed sessions, and applies login throttling.
- `Backend/functions/api/logout.js`: deletes the server session and expires the cookie.
- `Backend/functions/api/session.js`: confirms an active server session.
- `scripts/prepare-pages.js`: stages backend source at the repository-root `functions` location required by Cloudflare Pages.
- `Backend/functions/_lib/github.js`: authenticated GitHub API helpers for photo commits.
- `Backend/functions/api/admin/photos/upload.js`: validates and commits uploaded photos.
- `Backend/functions/api/admin/photos/remove.js`: removes an image and restores its placeholder state.
- `Frontend/photo-loader.js`: applies the photo manifest to public page slots.
- `Frontend/data/photos.json`: image-to-public-slot manifest updated by GitHub commits.
- `Documentation/AUTHENTICATION.md`: Cloudflare configuration and test instructions.

The public pages and their navigation are unchanged. The existing `Admin-Login` folder is retained rather than renamed.

## Cloudflare Pages setup

1. Open the Pages project in the Cloudflare dashboard.
2. Under **Settings > Builds & deployments**, set the build command to `npm run prepare:pages` and the build output directory to `Frontend`.
3. The build command copies `Backend/functions` to the repository-root `functions` directory that Cloudflare Pages requires.
4. Add a KV namespace under **Workers & Pages > KV**.
5. In the Pages project, open **Settings > Bindings** and add a KV namespace binding:
   - Variable name: `SESSION_KV`
   - KV namespace: the namespace created in step 3
6. Open **Settings > Environment variables**.
7. Add `ADMIN_EMAIL` as `administracion@centrovias.com` for both Production and Preview unless Preview should use separate test values.
8. Create `ADMIN_PASSWORD_HASH` as an encrypted/secret variable.

Do not use plaintext password, `.env`, or `.dev.vars` files for production. The hash format is:

```text
pbkdf2_sha256$100000$<BASE64_SALT>$<BASE64_DIGEST>
```

Use this local command from PowerShell to generate a fresh random-salted hash. Enter the actual password only at the prompt, not in a file:

```powershell
$password = Read-Host "Password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
node -e "const c=require('crypto');const p=process.argv[1];const s=c.randomBytes(16);c.pbkdf2(p,s,100000,32,'sha256',(e,d)=>{if(e)throw e;console.log('pbkdf2_sha256$100000$'+s.toString('base64')+'$'+d.toString('base64'))})" $plain
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
```

Copy only the printed `pbkdf2_sha256$...` value into the Cloudflare `ADMIN_PASSWORD_HASH` secret. Cloudflare encrypts secret values, and the repository does not receive the plaintext or hash.

Redeploy after changing bindings or secrets. Preview and Production bindings/secrets must be configured separately.

## GitHub photo management setup

The dashboard photo uploader writes through the GitHub REST API. It requires:

- Repository: `Centro-VIAS/Capstone_Centro-Vias`
- Branch: `main`
- A fine-grained personal access token with **Contents: Read and write** for that repository

Create the token under GitHub **Settings > Developer settings > Personal access tokens > Fine-grained tokens**:

1. Select `Centro-VIAS/Capstone_Centro-Vias`.
2. Set repository permission **Contents** to **Read and write**.
3. Create the token and copy it once.
4. In Cloudflare Pages, open **Settings > Environment variables**.
5. Add the following encrypted/secret variable:
   - `GITHUB_TOKEN`: the fine-grained token
6. Optionally add environment variables:
   - `GITHUB_OWNER=Centro-VIAS`
   - `GITHUB_REPO=Capstone_Centro-Vias`
   - `GITHUB_BRANCH=main`

Do not place the GitHub token in `.env`, `.dev.vars`, frontend files, or Git.

## Photo testing

1. Deploy the Cloudflare changes and configure `GITHUB_TOKEN`.
2. Log in and open the protected dashboard.
3. Select a page and image slot, enter alternative text, and upload a JPG, PNG, WebP, or GIF under 5 MB.
4. Confirm GitHub receives commits for the image and `Frontend/data/photos.json`.
5. Wait for Cloudflare Pages to complete its rebuild.
6. Open the public page and confirm the picture replaces the placeholder.
7. Return to the dashboard, select **Eliminar**, and confirm the placeholder returns after the rebuild.

## Session and attempt protection

- Sessions are random UUIDs stored in `SESSION_KV`; the cookie contains only the random session ID.
- Sessions expire after eight hours.
- Cookies use `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` on HTTPS requests.
- The login endpoint limits the KV key for a client IP to five attempts per 900-second window.
- Logout deletes the KV record and expires the browser cookie.

## Testing

### Local preview

Run `npm run dev` from the repository root. The script reads `ADMIN_PASSWORD_HASH`
from a gitignored `.dev.vars` file when present, or prompts for it securely. Create
`.dev.vars` in this format if you prefer not to enter the hash at every startup:

```text
ADMIN_PASSWORD_HASH=pbkdf2_sha256$100000$<BASE64_SALT>$<BASE64_DIGEST>
```

The local script writes `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` to `.dev.vars` and
starts Wrangler with the `SESSION_KV` KV binding. If `/api/login` returns 503, check the Wrangler terminal for a
`Login authentication is missing:` message; it identifies only the missing binding
or variable name.

### Successful login

1. Open `/Admin-Login/Admin-Login.html`. If the local preview removes `.html`, `/Admin-Login/Admin-Login` is also supported.
2. Enter `administracion@centrovias.com` and the configured administrator password.
3. Confirm the browser redirects to `/Admin-Login/dashboard.html`.
4. Open `/api/session`; confirm it returns `{"authenticated":true}`.

### Failed login

1. Use an incorrect password or email.
2. Confirm HTTP 401 and the Spanish error: “Correo electrónico o contraseña incorrectos.”
3. Repeat until the attempt limit is reached.
4. Confirm HTTP 429 and the retry message.

### Direct URL access

1. In a private browser window with no session cookie, open `/Admin-Login/dashboard.html`.
2. Confirm the server redirects to `/Admin-Login/Admin-Login.html`.
3. Open `/api/session`.
4. Confirm HTTP 401 and `{"error":"No autorizado."}`.
5. Confirm public pages such as `/index.html` remain accessible.

### Session expiration

1. Log in and open the dashboard.
2. Wait eight hours, or temporarily replace the test session record's `expiresAt` in KV with an expired timestamp.
3. Reload `/Admin-Login/dashboard.html` or request `/api/session`.
4. Confirm the session is rejected and the browser redirects or receives HTTP 401.

### Logout

1. Log in and open the dashboard.
2. Select **Cerrar sesión**.
3. Confirm the browser returns to the login page.
4. Open `/Admin-Login/dashboard.html` again and confirm direct access is denied.
5. Confirm `/api/session` returns HTTP 401.
