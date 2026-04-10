param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot '.claude'
$targetRoot = Join-Path $projectRoot '.cursor'

if (-not (Test-Path $sourceRoot)) {
  Write-Error "Source folder not found: $sourceRoot"
}

$filesToCopy = @(
  @{ Source = 'CLAUDE.md'; Target = 'CLAUDE.md' },
  @{ Source = 'CLAUDE.local.md'; Target = 'CLAUDE.local.md' },
  @{ Source = 'memory.md'; Target = 'memory.md' },
  @{ Source = 'settings.json'; Target = 'settings.json' },
  @{ Source = 'settings.local.json'; Target = 'settings.local.json' }
)

$dirsToMirror = @(
  @{ Source = 'agents'; Target = 'agents' },
  @{ Source = 'rules'; Target = 'rules' },
  @{ Source = 'skills'; Target = 'skills' }
)

if (-not (Test-Path $targetRoot)) {
  if ($DryRun) {
    Write-Host "[DryRun] Would create: $targetRoot"
  } else {
    New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
  }
}

foreach ($file in $filesToCopy) {
  $src = Join-Path $sourceRoot $file.Source
  $dst = Join-Path $targetRoot $file.Target

  if (-not (Test-Path $src)) {
    Write-Warning "Skip missing file: $src"
    continue
  }

  if ($DryRun) {
    Write-Host "[DryRun] Copy file: $src -> $dst"
  } else {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "Copied file: $($file.Source)"
  }
}

foreach ($dir in $dirsToMirror) {
  $srcDir = Join-Path $sourceRoot $dir.Source
  $dstDir = Join-Path $targetRoot $dir.Target

  if (-not (Test-Path $srcDir)) {
    Write-Warning "Skip missing dir: $srcDir"
    continue
  }

  if ($DryRun) {
    Write-Host "[DryRun] Mirror dir: $srcDir -> $dstDir"
    continue
  }

  New-Item -ItemType Directory -Path $dstDir -Force | Out-Null

  $srcItems = Get-ChildItem -Path $srcDir -File | Select-Object -ExpandProperty Name
  $dstItems = @()
  if (Test-Path $dstDir) {
    $dstItems = Get-ChildItem -Path $dstDir -File | Select-Object -ExpandProperty Name
  }

  foreach ($name in $srcItems) {
    Copy-Item -Path (Join-Path $srcDir $name) -Destination (Join-Path $dstDir $name) -Force
    Write-Host "Copied $($dir.Target)/$name"
  }

  foreach ($name in $dstItems) {
    if ($srcItems -notcontains $name) {
      Remove-Item -Path (Join-Path $dstDir $name) -Force
      Write-Host "Removed stale file $($dir.Target)/$name"
    }
  }
}

Write-Host ''
Write-Host 'Sync .claude -> .cursor completed.'
