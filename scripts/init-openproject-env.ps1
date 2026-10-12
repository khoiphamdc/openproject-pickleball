# Creates a persistent, unique Rails secret for a NEW local OpenProject instance.
# Does not overwrite an existing .env. Keep the same .env across restarts.
$ErrorActionPreference = 'Stop'
$envDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\infra\openproject'))
$envPath = Join-Path $envDirectory '.env'

if (Test-Path -LiteralPath $envPath) {
    Write-Host 'Existing .env kept. No secret was changed.'
    exit 0
}

[System.IO.Directory]::CreateDirectory($envDirectory) | Out-Null
$randomBytes = New-Object byte[] 64
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $generator.GetBytes($randomBytes)
}
finally {
    $generator.Dispose()
}
$secret = [System.BitConverter]::ToString($randomBytes).Replace('-', '').ToLowerInvariant()
$content = "OPENPROJECT_IMAGE=openproject/openproject:17`nSECRET_KEY_BASE=$secret`n"
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($envPath, $content, $utf8WithoutBom)
Write-Host 'Created infra/openproject/.env. Keep it private; reuse it on every restart.'
