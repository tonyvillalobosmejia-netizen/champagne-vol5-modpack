param([Parameter(Mandatory=$true)][string]$PlanFile,[Parameter(Mandatory=$true)][int]$LauncherPid,[switch]$ValidateOnly)
$ErrorActionPreference = 'Stop'
$taskDirectory = [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($PlanFile))
$temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
if (-not $taskDirectory.StartsWith($temporaryRoot,[StringComparison]::OrdinalIgnoreCase) -or -not (Split-Path $taskDirectory -Leaf).StartsWith('villawolf-uninstall-')) { throw 'Carpeta temporal inválida' }
try {
  $plan = Get-Content -LiteralPath $PlanFile -Raw -Encoding UTF8 | ConvertFrom-Json
  $roaming = [IO.Path]::GetFullPath([Environment]::GetFolderPath('ApplicationData'))
  $game = [IO.Path]::GetFullPath($plan.gameRoot)
  $data = [IO.Path]::GetFullPath($plan.userData)
  if ($game -ine (Join-Path $roaming 'MiLauncher') -or $data -inotmatch ('^' + [regex]::Escape($roaming) + '\\(mi-launcher-forge|VillaWolf Launcher)$')) { throw 'Carpetas de datos inválidas' }
  $uninstaller = [IO.Path]::GetFullPath($plan.uninstaller)
  if ((Split-Path $uninstaller -Leaf) -notin @('Uninstall VillaWolf Launcher.exe','Uninstall Mi Launcher.exe') -or -not (Test-Path -LiteralPath $uninstaller -PathType Leaf)) { throw 'Desinstalador inválido' }
  if ($ValidateOnly) { Write-Output 'Plan validado sin desinstalar ni eliminar datos'; exit 0 }
  $deadline = (Get-Date).AddSeconds(90)
  while (Get-Process -Id $LauncherPid -ErrorAction SilentlyContinue) {
    if ((Get-Date) -gt $deadline) { throw 'El launcher no se cerró; no se eliminaron datos' }
    Start-Sleep -Milliseconds 500
  }
  $process = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -PassThru -Wait
  if ($process.ExitCode -ne 0) { throw 'La desinstalación falló; no se eliminaron datos' }
  if ($plan.removeData -eq $true) {
    foreach ($target in @($game,$data)) {
      $item = Get-Item -LiteralPath $target -Force -ErrorAction SilentlyContinue
      if ($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'No se eliminará una carpeta enlazada' }
      if ($item) {
        function Remove-OwnedTree([string]$directory,[string]$allowedRoot) {
          $full = [IO.Path]::GetFullPath($directory)
          if ($full -ine $allowedRoot -and -not $full.StartsWith($allowedRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta fuera de la carpeta autorizada' }
          foreach ($entry in Get-ChildItem -LiteralPath $full -Force) {
            if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) {
              if ($entry.PSIsContainer) { [IO.Directory]::Delete($entry.FullName,$false) } else { [IO.File]::Delete($entry.FullName) }
            } elseif ($entry.PSIsContainer) { Remove-OwnedTree $entry.FullName $allowedRoot }
            else { Remove-Item -LiteralPath $entry.FullName -Force }
          }
          Remove-Item -LiteralPath $full -Force
        }
        Remove-OwnedTree $target $target
      }
    }
  }
  Remove-Item -LiteralPath $taskDirectory -Recurse -Force
} catch {
  $_.Exception.Message | Set-Content -LiteralPath (Join-Path $taskDirectory 'error-desinstalacion.txt')
  exit 1
}
