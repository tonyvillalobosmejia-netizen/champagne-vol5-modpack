param([Parameter(Mandatory=$true)][string]$Jar, [Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Directory]::CreateDirectory($Destination) | Out-Null
$zip = [System.IO.Compression.ZipFile]::OpenRead($Jar)
$count = 0
try {
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName -notmatch '^windows/x64/(?:[^/]+/)*[^/]+\.dll$') { continue }
    $name = [System.IO.Path]::GetFileName($entry.FullName)
    if ($name -notmatch '^[A-Za-z0-9_.-]+\.dll$') { throw 'Nombre de DLL inseguro' }
    $target = [System.IO.Path]::Combine($Destination, $name)
    $inputStream = $entry.Open()
    try {
      $outputStream = [System.IO.File]::Create($target)
      try { $inputStream.CopyTo($outputStream) } finally { $outputStream.Dispose() }
    } finally { $inputStream.Dispose() }
    $count++
  }
} finally { $zip.Dispose() }
Write-Output "DLL extraidas: $count"
