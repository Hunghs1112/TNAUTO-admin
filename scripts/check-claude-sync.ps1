$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot

$entries = @(
  @{ Source = '.claude/CLAUDE.md'; Target = '.cursor/CLAUDE.md' },
  @{ Source = '.claude/CLAUDE.local.md'; Target = '.cursor/CLAUDE.local.md' },
  @{ Source = '.claude/memory.md'; Target = '.cursor/memory.md' },
  @{ Source = '.claude/settings.json'; Target = '.cursor/settings.json' },
  @{ Source = '.claude/settings.local.json'; Target = '.cursor/settings.local.json' },
  @{ Source = '.claude/agents'; Target = '.cursor/agents'; IsDir = $true },
  @{ Source = '.claude/rules'; Target = '.cursor/rules'; IsDir = $true },
  @{ Source = '.claude/skills'; Target = '.cursor/skills'; IsDir = $true }
)

function Get-FileMap([string]$dirPath) {
  if (-not (Test-Path $dirPath)) { return @{} }

  $base = (Resolve-Path $dirPath).Path
  $result = @{}

  Get-ChildItem -Path $base -File -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring($base.Length).TrimStart('\\') -replace '\\', '/'
    $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
    $result[$relative] = $hash
  }

  return $result
}

$differences = @()

foreach ($entry in $entries) {
  $isDir = $entry.ContainsKey('IsDir') -and $entry.IsDir

  $srcPath = Join-Path $projectRoot $entry.Source
  $dstPath = Join-Path $projectRoot $entry.Target

  if (-not (Test-Path $srcPath)) {
    continue
  }

  if (-not $isDir) {
    if (-not (Test-Path $dstPath)) {
      $differences += "Missing target file: $($entry.Target)"
      continue
    }

    $srcHash = (Get-FileHash -Path $srcPath -Algorithm SHA256).Hash
    $dstHash = (Get-FileHash -Path $dstPath -Algorithm SHA256).Hash
    if ($srcHash -ne $dstHash) {
      $differences += "Different content: $($entry.Source) != $($entry.Target)"
    }

    continue
  }

  $srcMap = Get-FileMap $srcPath
  $dstMap = Get-FileMap $dstPath

  foreach ($k in $srcMap.Keys) {
    if (-not $dstMap.ContainsKey($k)) {
      $differences += "Missing target file: $($entry.Target)/$k"
      continue
    }

    if ($srcMap[$k] -ne $dstMap[$k]) {
      $differences += "Different content: $($entry.Source)/$k != $($entry.Target)/$k"
    }
  }

  foreach ($k in $dstMap.Keys) {
    if (-not $srcMap.ContainsKey($k)) {
      $differences += "Extra file in target: $($entry.Target)/$k"
    }
  }
}

if ($differences.Count -gt 0) {
  Write-Host ''
  Write-Host '.cursor is not in sync with .claude:' -ForegroundColor Yellow
  $differences | ForEach-Object { Write-Host " - $_" }
  Write-Host ''
  Write-Host 'Run: npm run sync:claude' -ForegroundColor Cyan
  exit 1
}

Write-Host '.cursor is in sync with .claude.' -ForegroundColor Green
