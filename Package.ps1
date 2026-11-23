param(
    [Parameter(Mandatory=$true)][string]$InnoCompiler,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot 'dist')
)

$ErrorActionPreference = 'Stop'
$outputFolder = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
$stage = Join-Path $PSScriptRoot ('release-stage-' + [Guid]::NewGuid().ToString('N'))
$build = Join-Path $stage 'app'
$portable = Join-Path $stage 'portable'
& (Join-Path $PSScriptRoot 'Build.ps1') -OutputDirectory $build
$version = [Reflection.AssemblyName]::GetAssemblyName((Join-Path $build 'OzgecmisAsistani.exe')).Version.ToString(3)

& $InnoCompiler "/DBuildDir=$build" "/DOutputDir=$outputFolder" "/DAppVersion=$version" (Join-Path $PSScriptRoot 'installer.iss')
if ($LASTEXITCODE -ne 0) { throw "Kurulum paketi derlenemedi ($LASTEXITCODE)." }

New-Item -ItemType Directory -Path $portable -Force | Out-Null
Get-ChildItem -LiteralPath $build | Copy-Item -Destination $portable -Recurse
[IO.File]::WriteAllText((Join-Path $portable 'portable.mode'), "portable\n")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README.md') -Destination $portable
$runtimeLink = "[InternetShortcut]`r`nURL=https://dotnet.microsoft.com/download/dotnet-framework/net48`r`n"
[IO.File]::WriteAllText((Join-Path $portable 'Microsoft .NET Framework 4.8.url'), $runtimeLink, [Text.Encoding]::ASCII)
Compress-Archive -Path (Join-Path $portable '*') -DestinationPath (Join-Path $outputFolder "OzgecmisAsistani-$version-portable.zip") -Force