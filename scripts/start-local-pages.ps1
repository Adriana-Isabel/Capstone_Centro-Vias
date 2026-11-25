param(
  [string]$AdminEmail = "administracion@centrovias.com",
  [string]$AdminPasswordHash,
  [string]$GitHubToken
)

$devVarsPath = Join-Path $PSScriptRoot "..\.dev.vars"

if ([string]::IsNullOrWhiteSpace($GitHubToken) -and (Test-Path $devVarsPath)) {
  foreach ($line in Get-Content $devVarsPath) {
    if ($line -match '^GITHUB_TOKEN=(.*)$') {
      $GitHubToken = $Matches[1].Trim('"').Trim("'")
      break
    }
  }
}

if ([string]::IsNullOrWhiteSpace($AdminPasswordHash)) {
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

$devVars = @(
  "ADMIN_EMAIL=$AdminEmail",
  "ADMIN_PASSWORD_HASH=$AdminPasswordHash"
)
if (-not [string]::IsNullOrWhiteSpace($GitHubToken)) {
  $devVars += "GITHUB_TOKEN=$GitHubToken"
}
Set-Content -Path $devVarsPath -Value $devVars -Encoding ASCII
$frontendDevVarsPath = Join-Path $PSScriptRoot "..\Frontend\.dev.vars"
Set-Content -Path $frontendDevVarsPath -Value $devVars -Encoding ASCII
$frontendWranglerPath = Join-Path $PSScriptRoot "..\Frontend\wrangler.toml"
$localStatePath = Join-Path $PSScriptRoot "..\.wrangler\state"
$escapedPasswordHash = $AdminPasswordHash.Replace('\', '\\').Replace('"', '\"')
$wranglerConfig = @(
  'compatibility_date = "2026-11-19"',
  '',
  '[vars]',
  "ADMIN_EMAIL = `"$AdminEmail`"",
  "ADMIN_PASSWORD_HASH = `"$escapedPasswordHash`"",
  '',
  '[[d1_databases]]',
  'binding = "COMMENTS_DB"',
  'database_name = "centro-vias-comments"',
  'database_id = "00000000-0000-0000-0000-000000000001"',
  'migrations_dir = "../Backend/migrations"'
)
Set-Content -Path $frontendWranglerPath -Value $wranglerConfig -Encoding ASCII

npm run prepare:pages
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$migrationArguments = @(
  'd1', 'migrations', 'apply', 'centro-vias-comments',
  '--local',
  '--force',
  '--persist-to', $localStatePath,
  '--config', 'Frontend/wrangler.toml'
)
& npx wrangler @migrationArguments
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$wranglerArguments = @(
  'pages', 'dev', 'Frontend',
  '--ip', '127.0.0.1',
  '--port', '8788',
  '--persist-to', $localStatePath,
  '--kv', 'SESSION_KV',
  '--d1', 'COMMENTS_DB=00000000-0000-0000-0000-000000000001',
  '--binding', "ADMIN_EMAIL=$AdminEmail",
  '--binding', "ADMIN_PASSWORD_HASH=$AdminPasswordHash"
)

if (-not [string]::IsNullOrWhiteSpace($GitHubToken)) {
  $wranglerArguments += '--binding'
  $wranglerArguments += "GITHUB_TOKEN=$GitHubToken"
}

& npx wrangler @wranglerArguments
