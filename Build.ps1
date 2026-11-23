param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot 'build'),
    [string]$PackageDirectory = (Join-Path $PSScriptRoot 'packages'),
    [string]$TestSource,
    [ValidateSet("anycpu","x86")][string]$TestPlatform = "anycpu"
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$outputFolder = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
$packageFolder = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($PackageDirectory)
New-Item -ItemType Directory -Force -Path $outputFolder, $packageFolder | Out-Null

function Get-Package([string]$Id, [string]$Version) {
    $name = "$Id.$Version"
    $folder = Join-Path $packageFolder $name
    $marker = Join-Path $folder '[Content_Types].xml'
    if (!(Test-Path -LiteralPath $marker)) {
        $archive = Join-Path $packageFolder "$name.zip"
        if (!(Test-Path -LiteralPath $archive)) {
            $download = "$archive.download"
            Invoke-WebRequest -UseBasicParsing "https://api.nuget.org/v3-flatcontainer/$Id/$Version/$name.nupkg" -OutFile $download
            Move-Item -LiteralPath $download -Destination $archive
        }
        Expand-Archive -LiteralPath $archive -DestinationPath $folder -Force
    }
    return $folder
}

$runtimePackages = @(
    @('pdfsharp-gdi','6.2.4','lib\net462','PdfSharp-gdi.dll,PdfSharp.Shared.dll,PdfSharp.System.dll'),
    @('microsoft.extensions.logging.abstractions','8.0.3','lib\net462','Microsoft.Extensions.Logging.Abstractions.dll'),
    @('microsoft.extensions.dependencyinjection.abstractions','8.0.2','lib\net462','Microsoft.Extensions.DependencyInjection.Abstractions.dll'),
    @('microsoft.bcl.asyncinterfaces','8.0.0','lib\net462','Microsoft.Bcl.AsyncInterfaces.dll'),
    @('system.threading.tasks.extensions','4.5.4','lib\net461','System.Threading.Tasks.Extensions.dll'),
    @('system.memory','4.5.5','lib\net461','System.Memory.dll'),
    @('system.buffers','4.5.1','lib\net461','System.Buffers.dll'),
    @('system.runtime.compilerservices.unsafe','6.0.0','lib\net461','System.Runtime.CompilerServices.Unsafe.dll'),
    @('system.numerics.vectors','4.5.0','lib\net46','System.Numerics.Vectors.dll'),
    @('system.valuetuple','4.5.0','lib\net461','System.ValueTuple.dll'),
    @('system.runtime.interopservices.runtimeinformation','4.3.0','runtimes\win\lib\net45','System.Runtime.InteropServices.RuntimeInformation.dll')
)
$redirects = foreach ($package in $runtimePackages) {
    $folder = Get-Package $package[0] $package[1]
    $library = Join-Path $folder $package[2]
    foreach ($filename in ($package[3] -split ',')) {
        $assembly = Join-Path $library $filename
        Copy-Item -LiteralPath $assembly -Destination $outputFolder -Force
        $name = [Reflection.AssemblyName]::GetAssemblyName($assembly)
        $token = ($name.GetPublicKeyToken() | ForEach-Object { $_.ToString('x2') }) -join ''
        if ($token) {
            "      <dependentAssembly><assemblyIdentity name=`"$($name.Name)`" publicKeyToken=`"$token`" culture=`"neutral`"/><bindingRedirect oldVersion=`"0.0.0.0-$($name.Version)`" newVersion=`"$($name.Version)`"/></dependentAssembly>"
        }
    }

    $notices = Join-Path $outputFolder ('Licenses\' + $package[0])
    foreach ($notice in Get-ChildItem -LiteralPath $folder -File | Where-Object { $_.Name -match '^(LICENSE|THIRD.?PARTY.?NOTICES|dotnet_library_license)' }) {
        New-Item -ItemType Directory -Path $notices -Force | Out-Null
        Copy-Item -LiteralPath $notice.FullName -Destination $notices -Force
    }
}

$pdfNotices = Join-Path $outputFolder 'Licenses\pdfsharp-gdi'
New-Item -ItemType Directory -Path $pdfNotices -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'PDFsharp-LICENSE.txt') -Destination $pdfNotices -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'LICENSE') -Destination $outputFolder -Force

$targetPackage = Get-Package 'microsoft.netframework.referenceassemblies.net48' '1.0.3'
$framework = Join-Path $targetPackage 'build\.NETFramework\v4.8'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (!(Test-Path -LiteralPath $compiler)) { throw '.NET Framework C# derleyicisi bulunamadı.' }

$system = 'mscorlib','System','System.Core','System.Windows.Forms','System.Drawing','System.Web.Extensions','System.IO.Compression','System.Net.Http','System.Security','System.Xml','Facades\netstandard'
$references = @($system | ForEach-Object { '/reference:' + (Join-Path $framework "$_.dll") })
$references += '/reference:' + (Join-Path $outputFolder 'PdfSharp-gdi.dll')
$sourceNames = 'Model','Main','FieldDialog','WordExport','PdfExport','CvReview','ReviewDialog','Preferences','HtmlGuide','Shortcuts','Language','AiSummary','SummaryDialog','ApiKeys','JobMatch','CvSearch','SearchDialog','AppPaths','ReleaseUpdates','FeedbackMessage'
$sources = @($sourceNames | ForEach-Object { Join-Path $PSScriptRoot "$_.cs" })
$target = '/target:winexe'
$platform = '/platform:anycpu'
$entryPoint = @()
$exe = Join-Path $outputFolder 'OzgecmisAsistani.exe'
if ($TestSource) {
    $target = '/target:exe'
    $platform = "/platform:$TestPlatform"
    $entryPoint = @('/main:ReleaseSmoke')
    $sources += (Resolve-Path -LiteralPath $TestSource).Path
    $exe = Join-Path $outputFolder 'ReleaseSmoke.exe'
}
& $compiler /nologo /noconfig /nostdlib+ $target $platform /optimize+ /warnaserror /nowarn:1685 "/out:$exe" @references @entryPoint @sources
if ($LASTEXITCODE -ne 0) { throw "Derleme başarısız ($LASTEXITCODE)." }

$config = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <startup><supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.8"/></startup>
  <runtime>
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
$($redirects -join [Environment]::NewLine)
    </assemblyBinding>
  </runtime>
</configuration>
"@
[IO.File]::WriteAllText("$exe.config", $config, [Text.UTF8Encoding]::new($false))