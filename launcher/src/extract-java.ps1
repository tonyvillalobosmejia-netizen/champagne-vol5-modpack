param([Parameter(Mandatory=$true)][string]$Archive, [Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [IO.Path]::GetFullPath($Destination).TrimEnd('\') + '\'
[IO.Directory]::CreateDirectory($root) | Out-Null
$zip = [IO.Compression.ZipFile]::OpenRead($Archive)
try {
  if ($zip.Entries.Count -gt 15000) { throw 'El ZIP de Java tiene demasiadas entradas.' }
  $total = [long]0
  $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($entry in $zip.Entries) {
    $name = $entry.FullName.Replace('\', '/')
    $parts = $name.TrimEnd('/').Split('/')
    if (!$name -or $name.StartsWith('/') -or $name.Contains(':') -or ($parts | Where-Object { $_ -eq '..' -or $_ -eq '.' -or $_ -eq '' -or $_ -match '[<>:"|?*\x00-\x1f]' -or $_ -match '[. ]$' -or $_ -match '^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)' })) { throw "Ruta ZIP no permitida: $name" }
    if ((($entry.ExternalAttributes -shr 16) -band 0xF000) -eq 0xA000) { throw 'No se permiten enlaces en el ZIP de Java.' }
    $target = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $name.Replace('/', '\')))
    if (!$target.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or !$seen.Add($target)) { throw "Ruta ZIP duplicada o fuera del destino: $name" }
    $total += $entry.Length
    if ($total -gt 600MB) { throw 'Java extraído supera el tamaño permitido.' }
  }
  foreach ($entry in $zip.Entries) {
    $target = [IO.Path]::Combine($root, $entry.FullName.Replace('/', '\'))
    if ($entry.FullName.EndsWith('/')) { [IO.Directory]::CreateDirectory($target) | Out-Null }
    else {
      [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $false)
    }
  }
} finally { $zip.Dispose() }
