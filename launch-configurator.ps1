# Configurator Studio — masaüstü uygulaması başlatıcısı.
# 1) Yerel sunucu (npx serve) çalışmıyorsa arka planda başlatır.
# 2) Chrome'u "--app" modunda açar — adres çubuğu/sekme yok, gerçek bir masaüstü uygulaması gibi
#    kendi penceresinde ve kendi görev çubuğu simgesinde açılır.

$ErrorActionPreference = "SilentlyContinue"
$port = 8972
$root = "C:\Users\rahmi\CLAUDE_PROJECTS\UE5 Configurator UI Designer"
$url  = "http://localhost:$port/03_ARAC/model-material-editor.html"

function Test-ServerUp {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        return $resp.StatusCode -eq 200
    } catch { return $false }
}

if (-not (Test-ServerUp)) {
    $nodeDir = "C:\Program Files\nodejs"
    if (Test-Path $nodeDir) { $env:Path = "$nodeDir;$env:Path" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx --yes serve -l $port ." `
        -WorkingDirectory $root -WindowStyle Hidden

    $tries = 0
    while (-not (Test-ServerUp) -and $tries -lt 30) {
        Start-Sleep -Milliseconds 500
        $tries++
    }
}

$browserPaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $browserPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browser) {
    Start-Process -FilePath $browser -ArgumentList `
        "--app=$url", `
        "--window-size=1600,960", `
        "--user-data-dir=$env:LOCALAPPDATA\ConfiguratorStudioAppProfile"
} else {
    Start-Process $url
}
