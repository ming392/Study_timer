param([string]$Sdk="$env:LOCALAPPDATA\Android\Sdk")
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$bt=Join-Path $Sdk 'build-tools\36.1.0'
$android=Join-Path $Sdk 'platforms\android-36.1\android.jar'
$javaBin=Split-Path (Get-Command javac.exe).Source
function Run([string]$exe,[string[]]$arguments){ & $exe @arguments; if($LASTEXITCODE -ne 0){throw "$exe failed: $LASTEXITCODE"} }
New-Item -ItemType Directory -Force build,build\classes,build\dex | Out-Null
Run (Join-Path $bt 'aapt.exe') @('package','-f','-M','AndroidManifest.xml','-S','res','-A','assets','-I',$android,'-F','build\unsigned.apk')
$sources=@(Get-ChildItem 'src\com\study\timer\*.java' | ForEach-Object {$_.FullName})
Run (Join-Path $javaBin 'javac.exe') (@('-encoding','UTF-8','-source','8','-target','8','-classpath',$android,'-d','build\classes')+$sources)
$classes=@(Get-ChildItem build\classes -Recurse -Filter '*.class' | ForEach-Object {$_.FullName})
Run (Join-Path $bt 'd8.bat') (@('--lib',$android,'--min-api','26','--output','build\dex')+$classes)
Copy-Item build\unsigned.apk build\with-dex.apk -Force
Push-Location build\dex
try { Run (Join-Path $bt 'aapt.exe') @('add','..\with-dex.apk','classes.dex') } finally { Pop-Location }
Run (Join-Path $bt 'zipalign.exe') @('-f','-p','4','build\with-dex.apk','build\aligned.apk')
Copy-Item build\aligned.apk StudyTimer_v0.6_unsigned.apk -Force
Write-Host 'Unsigned APK ready. Run Sign-Update.ps1 with the original signing key.'
