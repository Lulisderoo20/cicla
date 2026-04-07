param(
  [int]$Port = 4173
)

$root = Split-Path -Parent $PSScriptRoot
$url = "http://localhost:$Port"

function Resolve-PythonCommand {
  if (Get-Command py -ErrorAction SilentlyContinue) {
    return @{
      FilePath = "py.exe"
      Arguments = @("-3", "-m", "http.server", "$Port")
    }
  }

  if (Get-Command python -ErrorAction SilentlyContinue) {
    return @{
      FilePath = "python.exe"
      Arguments = @("-m", "http.server", "$Port")
    }
  }

  throw "No encontre Python para levantar el servidor local."
}

function Open-PreferredBrowser {
  param(
    [string]$TargetUrl
  )

  $edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  $chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

  if (Test-Path $chrome) {
    Start-Process -FilePath $chrome -ArgumentList $TargetUrl | Out-Null
    return
  }

  if (Test-Path $edge) {
    Start-Process -FilePath $edge -ArgumentList $TargetUrl | Out-Null
    return
  }

  Start-Process $TargetUrl | Out-Null
}

try {
  $python = Resolve-PythonCommand

  Write-Host ""
  Write-Host "Cicla se va a abrir en $url" -ForegroundColor Cyan
  Write-Host "Despues, usa el boton 'Descargar' dentro de Cicla o en Chrome: menu > Enviar, guardar y compartir > Instalar pagina como aplicacion" -ForegroundColor Yellow
  Write-Host "Deja esta ventana abierta mientras uses la app." -ForegroundColor Yellow
  Write-Host ""

  $server = Start-Process `
    -FilePath $python.FilePath `
    -ArgumentList $python.Arguments `
    -WorkingDirectory $root `
    -PassThru

  Start-Sleep -Seconds 2
  Open-PreferredBrowser -TargetUrl $url

  Wait-Process -Id $server.Id
} catch {
  Write-Error $_
  exit 1
}
