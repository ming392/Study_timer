param(
    [string]$Sdk = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$KeyStore = "$env:USERPROFILE\Documents\Codex\2026-11-24\new-chat-2\study-timer\build\prototype.keystore"
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$expected = '9c5a86e64e93b478302392f28160f590892db9ff7aa97e97a6ff0a2ec20f93ff'
if (!(Test-Path -LiteralPath $KeyStore)) {
    throw "Original signing key not found: $KeyStore. Do not uninstall the existing app. Pass the original key with -KeyStore."
}
$bt = Join-Path $Sdk 'build-tools\36.1.0'
if (!(Test-Path "$bt\apksigner.bat")) {
    $bt = (Get-ChildItem (Join-Path $Sdk 'build-tools') -Directory | Sort-Object Name -Descending | Where-Object {Test-Path (Join-Path $_.FullName 'apksigner.bat')} | Select-Object -First 1).FullName
}
if (!$bt) { throw 'Android SDK build-tools not found. Pass the SDK directory with -Sdk.' }
$candidate = Join-Path $PSScriptRoot 'StudyTimer_v0.6_candidate.apk'
& "$bt\apksigner.bat" sign --ks "$KeyStore" --ks-key-alias prototype --ks-pass pass:android --key-pass pass:android --out "$candidate" 'StudyTimer_v0.6_unsigned.apk'
if ($LASTEXITCODE -ne 0) { throw 'APK signing failed.' }
$cert = & "$bt\apksigner.bat" verify --print-certs "$candidate"
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
if (!($cert | Select-String -SimpleMatch $expected)) {
    Remove-Item -LiteralPath $candidate
    throw 'This key does not match the installed v0.5 app. No update APK was produced.'
}
Move-Item -LiteralPath $candidate -Destination (Join-Path $PSScriptRoot 'StudyTimer_v0.6.apk') -Force
Write-Host 'Ready: StudyTimer_v0.6.apk'
Write-Host 'Install over the existing app. Keep the original app and its records.'
