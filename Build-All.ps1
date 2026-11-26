param(
    [string]$Sdk = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$KeyStore = "$env:USERPROFILE\Documents\Codex\2026-11-24\new-chat-2\study-timer\build\prototype.keystore"
)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'build.ps1') -Sdk $Sdk
& (Join-Path $PSScriptRoot 'Sign-Update.ps1') -Sdk $Sdk -KeyStore $KeyStore
