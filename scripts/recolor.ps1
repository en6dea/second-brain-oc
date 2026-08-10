# Переводит легаси-таблицу стилей из светлой палитры в токены Lumen.
# Разбор идёт по свойствам: цвет текста, фон, границы обрабатываются по-разному.
# Исходный файл не изменяется — результат пишется отдельно.

param(
  [string]$InPath  = "C:\Users\LOVKEY\Desktop\second-brain-oc\styles.css",
  [string]$OutPath = "C:\Users\LOVKEY\Desktop\second-brain-oc\styles-dark-base.css"
)

$css = [System.IO.File]::ReadAllText($InPath)

function Get-Rgb([string]$hex) {
  $h = $hex.TrimStart('#')
  if ($h.Length -eq 3) { $h = "$($h[0])$($h[0])$($h[1])$($h[1])$($h[2])$($h[2])" }
  if ($h.Length -eq 8) { $h = $h.Substring(0,6) }
  if ($h.Length -ne 6) { return $null }
  try {
    return @{
      r = [Convert]::ToInt32($h.Substring(0,2),16)
      g = [Convert]::ToInt32($h.Substring(2,2),16)
      b = [Convert]::ToInt32($h.Substring(4,2),16)
    }
  } catch { return $null }
}

function Get-Lum($c) { (0.2126*$c.r + 0.7152*$c.g + 0.0722*$c.b) / 255 }

function Get-Sat($c) {
  $mx = [Math]::Max($c.r,[Math]::Max($c.g,$c.b))
  $mn = [Math]::Min($c.r,[Math]::Min($c.g,$c.b))
  if ($mx -eq 0) { return 0 }
  return ($mx - $mn) / $mx
}

function Get-Hue($c) {
  $r = $c.r/255; $g = $c.g/255; $b = $c.b/255
  $mx = [Math]::Max($r,[Math]::Max($g,$b)); $mn = [Math]::Min($r,[Math]::Min($g,$b))
  $d = $mx - $mn
  if ($d -eq 0) { return 0 }
  if ($mx -eq $r) { $h = 60 * ((($g - $b)/$d) % 6) }
  elseif ($mx -eq $g) { $h = 60 * ((($b - $r)/$d) + 2) }
  else { $h = 60 * ((($r - $g)/$d) + 4) }
  if ($h -lt 0) { $h += 360 }
  return $h
}

# Насыщенный цвет -> семантический токен по оттенку
function Map-Hue($c) {
  $h = Get-Hue $c
  if ($h -ge 200 -and $h -lt 280) { return 'var(--lm-accent)' }
  if ($h -ge 280 -and $h -lt 330) { return 'var(--lm-accent-2)' }
  if ($h -ge 330 -or  $h -lt 18)  { return 'var(--lm-danger)' }
  if ($h -ge 18  -and $h -lt 95)  { return 'var(--lm-warn)' }
  if ($h -ge 95  -and $h -lt 175) { return 'var(--lm-good)' }
  return 'var(--lm-info)'
}

# $kind: text | bg | border
function Map-Color($c, [string]$kind) {
  $L = Get-Lum $c; $S = Get-Sat $c
  if ($S -ge 0.35 -and $L -gt 0.12 -and $L -lt 0.92) {
    $sem = Map-Hue $c
    if ($kind -eq 'border') { return 'var(--lm-accent-line)' }
    return $sem
  }
  switch ($kind) {
    'text'   { if ($L -lt 0.34) { return 'var(--lm-ink)' }
               elseif ($L -lt 0.68) { return 'var(--lm-muted)' }
               else { return 'var(--lm-ink)' } }
    'bg'     { if ($L -gt 0.72) { return 'var(--lm-surface)' }
               elseif ($L -gt 0.42) { return 'var(--lm-surface-2)' }
               else { return 'var(--lm-surface-solid)' } }
    'border' { return 'var(--lm-line)' }
  }
  return $null
}

$textProps   = 'color|-webkit-text-fill-color|fill|stroke|caret-color|text-decoration-color|accent-color|column-rule-color'
$bgProps     = 'background|background-color|background-image'
$borderProps = 'border|border-color|border-top|border-right|border-bottom|border-left|border-top-color|border-right-color|border-bottom-color|border-left-color|outline|outline-color'

$declRe = [regex]'(?<prop>[-a-zA-Z]+)\s*:\s*(?<val>[^;{}]+)'
$colorRe = [regex]'#[0-9a-fA-F]{3,8}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)'

$stats = @{ text = 0; bg = 0; border = 0; skipped = 0 }

$result = $declRe.Replace($css, {
  param($m)
  $prop = $m.Groups['prop'].Value.ToLower()
  $val  = $m.Groups['val'].Value

  # Объявления пользовательских свойств (--x: ...) не трогаем:
  # они уже переопределены мостом в styles-lumen.css
  if ($prop.StartsWith('--')) { return $m.Value }

  $kind = $null
  if ($prop -match "^($textProps)$")        { $kind = 'text' }
  elseif ($prop -match "^($bgProps)$")      { $kind = 'bg' }
  elseif ($prop -match "^($borderProps)$")  { $kind = 'border' }
  else { return $m.Value }

  $newVal = $colorRe.Replace($val, {
    param($cm)
    $tok = $cm.Value
    $alpha = 1.0
    $rgb = $null

    if ($tok.StartsWith('#')) {
      $rgb = Get-Rgb $tok
      if ($tok.TrimStart('#').Length -eq 8) {
        $alpha = [Convert]::ToInt32($tok.TrimStart('#').Substring(6,2),16) / 255
      }
    } else {
      $nums = [regex]::Matches($tok, '[\d.]+')
      if ($nums.Count -ge 3) {
        $rgb = @{ r = [double]$nums[0].Value; g = [double]$nums[1].Value; b = [double]$nums[2].Value }
        if ($nums.Count -ge 4) { $alpha = [double]$nums[3].Value }
      }
    }
    if ($null -eq $rgb) { return $tok }

    # Полупрозрачное поверх тёмного фона обычно работает как есть:
    # трогаем только заметно непрозрачное.
    if ($alpha -lt 0.55) {
      $L = Get-Lum $rgb
      # Тёмная полупрозрачная линия на светлой теме невидима на тёмной — заменяем
      if ($kind -eq 'border' -and $L -lt 0.5) { return 'var(--lm-line)' }
      return $tok
    }

    $mapped = Map-Color $rgb $kind
    if ($null -eq $mapped) { return $tok }
    return $mapped
  })

  return "$($m.Groups['prop'].Value): $newVal"
})

$header = @"
/* ============================================================================
   SECOND BRAIN OS — тёмная основа (сгенерировано автоматически)

   Это styles.css, у которого цвета переведены из светлой палитры в токены
   Lumen. Геометрия, сетки и отступы не изменялись. Файл собирается скриптом
   scratchpad/recolor.ps1 — правки вносите в исходный styles.css и пересоберите,
   иначе они потеряются.

   Откат: вернуть в index.html подключение styles.css вместо этого файла.
   ========================================================================== */

"@

[System.IO.File]::WriteAllText($OutPath, $header + $result, (New-Object System.Text.UTF8Encoding $false))

$before = ([regex]'#[0-9a-fA-F]{6}\b').Matches($css).Count
$after  = ([regex]'#[0-9a-fA-F]{6}\b').Matches($result).Count
Write-Output "written: $OutPath"
Write-Output "hex colours before: $before  after: $after  converted: $($before - $after)"
