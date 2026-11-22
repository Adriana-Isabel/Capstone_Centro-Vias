param(
  [string]$AdminEmail = "administracion@centrovias.com",
  [string]$AdminPasswordHash
)

if ([string]::IsNullOrWhiteSpace($AdminPasswordHash)) {
  $devVarsPath = Join-Path $PSScriptRoot "..\.dev.vars"
  if (Test-Path $devVarsPath) {
    foreach ($line in Get-Content $devVarsPath) {
      $trimmed = $line.Trim()
      if ($trimmed -match '^ADMIN_PASSWORD_HASH=(.*)$') {
        $AdminPasswordHash = $Matches[1].Trim('"').Trim("'")
        break
      }
    }
  }
}

if ([string]::IsNullOrWhiteSpace($AdminPasswordHash)) {
  $secureHash = Read-Host "Enter ADMIN_PASSWORD_HASH" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureHash)
  try {
    $AdminPasswordHash = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if ($AdminPasswordHash -notmatch '^pbkdf2_sha256\$[1-9][0-9]*\$[^$]+\$[^$]+$') {
  Write-Error "ADMIN_PASSWORD_HASH is not a valid pbkdf2_sha256 hash."
  exit 1
}

$devVarsPath = Join-Path $PSScriptRoot "..\.dev.vars"
$devVars = @(
  "ADMIN_EMAIL=$AdminEmail",
  "ADMIN_PASSWORD_HASH=$AdminPasswordHash"
)
Set-Content -Path $devVarsPath -Value $devVars -Encoding ASCII
$frontendDevVarsPath = Join-Path $PSScriptRoot "..\Frontend\.dev.vars"
Set-Content -Path $frontendDevVarsPath -Value $devVars -Encoding ASCII
$frontendWranglerPath = Join-Path $PSScriptRoot "..\Frontend\wrangler.toml"
$escapedPasswordHash = $AdminPasswordHash.Replace('\', '\\').Replace('"', '\"')
$wranglerConfig = @(
  'compatibility_date = "2026-11-19"',
  '',
  '[vars]',
  "ADMIN_EMAIL = `"$AdminEmail`"",
  "ADMIN_PASSWORD_HASH = `"$escapedPasswordHash`""
)
Set-Content -Path $frontendWranglerPath -Value $wranglerConfig -Encoding ASCII

npm run prepare:pages
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

npx wrangler pages dev Frontend `
  --ip 127.0.0.1 `
  --port 8788 `
  --kv SESSION_KV `
  --binding "ADMIN_EMAIL=$AdminEmail" `
  --binding "ADMIN_PASSWORD_HASH=$AdminPasswordHash"
