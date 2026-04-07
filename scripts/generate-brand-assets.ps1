Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root "assets"

function New-Color {
  param(
    [string]$Hex,
    [int]$Alpha = 255
  )

  $clean = $Hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    $Alpha,
    [Convert]::ToInt32($clean.Substring(0, 2), 16),
    [Convert]::ToInt32($clean.Substring(2, 2), 16),
    [Convert]::ToInt32($clean.Substring(4, 2), 16)
  )
}

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Font {
  param(
    [string]$Family,
    [float]$Size,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )

  try {
    return New-Object System.Drawing.Font($Family, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  } catch {
    return New-Object System.Drawing.Font("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  }
}

function Draw-BrandMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Size
  )

  $rect = New-Object System.Drawing.RectangleF($X, $Y, $Size, $Size)
  $path = New-RoundedRectPath $X $Y $Size $Size ($Size * 0.24)

  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    (New-Color "#d55b5b"),
    (New-Color "#ffb36a"),
    45.0
  )
  $Graphics.FillPath($gradient, $path)

  $glowBrush = New-Object System.Drawing.SolidBrush((New-Color "#fff8f0" 72))
  $Graphics.FillEllipse($glowBrush, $X + ($Size * 0.02), $Y - ($Size * 0.02), $Size * 0.56, $Size * 0.56)

  $moonBrush = New-Object System.Drawing.SolidBrush((New-Color "#fff4ea"))
  $shadowBrush = New-Object System.Drawing.SolidBrush((New-Color "#c95456" 52))
  $Graphics.FillEllipse($moonBrush, $X + ($Size * 0.25), $Y + ($Size * 0.2), $Size * 0.52, $Size * 0.52)
  $Graphics.FillEllipse($shadowBrush, $X + ($Size * 0.39), $Y + ($Size * 0.16), $Size * 0.44, $Size * 0.44)

  $crescentPoints = @(
    [System.Drawing.PointF]::new($X + ($Size * 0.29), $Y + ($Size * 0.66)),
    [System.Drawing.PointF]::new($X + ($Size * 0.37), $Y + ($Size * 0.79)),
    [System.Drawing.PointF]::new($X + ($Size * 0.5), $Y + ($Size * 0.84)),
    [System.Drawing.PointF]::new($X + ($Size * 0.66), $Y + ($Size * 0.81)),
    [System.Drawing.PointF]::new($X + ($Size * 0.75), $Y + ($Size * 0.68)),
    [System.Drawing.PointF]::new($X + ($Size * 0.76), $Y + ($Size * 0.48)),
    [System.Drawing.PointF]::new($X + ($Size * 0.72), $Y + ($Size * 0.36)),
    [System.Drawing.PointF]::new($X + ($Size * 0.67), $Y + ($Size * 0.53)),
    [System.Drawing.PointF]::new($X + ($Size * 0.56), $Y + ($Size * 0.62)),
    [System.Drawing.PointF]::new($X + ($Size * 0.44), $Y + ($Size * 0.62)),
    [System.Drawing.PointF]::new($X + ($Size * 0.33), $Y + ($Size * 0.56))
  )
  $Graphics.FillPolygon($moonBrush, $crescentPoints)

  $starBrush = New-Object System.Drawing.SolidBrush((New-Color "#fffaf4" 236))
  $Graphics.FillEllipse($starBrush, $X + ($Size * 0.18), $Y + ($Size * 0.21), $Size * 0.055, $Size * 0.055)
  $Graphics.FillEllipse($starBrush, $X + ($Size * 0.76), $Y + ($Size * 0.18), $Size * 0.036, $Size * 0.036)
  $Graphics.FillEllipse($starBrush, $X + ($Size * 0.79), $Y + ($Size * 0.62), $Size * 0.07, $Size * 0.07)
  $Graphics.FillEllipse($starBrush, $X + ($Size * 0.13), $Y + ($Size * 0.58), $Size * 0.03, $Size * 0.03)

  $orbitPen = New-Object System.Drawing.Pen((New-Color "#fff5ed" 110), ($Size * 0.02))
  $Graphics.DrawArc(
    $orbitPen,
    $X + ($Size * 0.16),
    $Y + ($Size * 0.53),
    $Size * 0.68,
    $Size * 0.26,
    10,
    156
  )

  $orbitPen.Dispose()
  $starBrush.Dispose()
  $shadowBrush.Dispose()
  $moonBrush.Dispose()
  $glowBrush.Dispose()
  $gradient.Dispose()
  $path.Dispose()
}

function Draw-Chip {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [string]$Text,
    [string]$FillHex,
    [string]$TextHex
  )

  $font = New-Font "Segoe UI Semibold" 22 ([System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush((New-Color $TextHex))
  $measure = $Graphics.MeasureString($Text, $font)
  $width = [Math]::Ceiling($measure.Width + 34)
  $height = 52
  $path = New-RoundedRectPath $X $Y $width $height 26
  $fill = New-Object System.Drawing.SolidBrush((New-Color $FillHex))

  $Graphics.FillPath($fill, $path)
  $Graphics.DrawString($Text, $font, $textBrush, $X + 17, $Y + 13)

  $font.Dispose()
  $textBrush.Dispose()
  $fill.Dispose()
  $path.Dispose()

  return $width
}

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Save-IcoFromPng {
  param(
    [string]$PngPath,
    [string]$IcoPath
  )

  $pngBytes = [System.IO.File]::ReadAllBytes($PngPath)
  $stream = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create)
  $writer = New-Object System.IO.BinaryWriter($stream)

  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]1)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$pngBytes.Length)
    $writer.Write([UInt32]22)
    $writer.Write($pngBytes)
  } finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

function Build-Icon {
  param(
    [int]$Size,
    [string]$Path
  )

  $canvas = New-Canvas $Size $Size

  try {
    Draw-BrandMark $canvas.Graphics 0 0 $Size
    Save-Png $canvas.Bitmap $Path
  } finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

function Build-OpenGraph {
  param(
    [string]$Path
  )

  $width = 1200
  $height = 630
  $canvas = New-Canvas $width $height
  $graphics = $canvas.Graphics
  $bitmap = $canvas.Bitmap

  try {
    $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $backgroundRect,
      (New-Color "#fff8f2"),
      (New-Color "#fff9f5"),
      25.0
    )
    $graphics.FillRectangle($backgroundBrush, $backgroundRect)

    $blobA = New-Object System.Drawing.SolidBrush((New-Color "#ffd7bf" 122))
    $blobB = New-Object System.Drawing.SolidBrush((New-Color "#d8f1f0" 186))
    $blobC = New-Object System.Drawing.SolidBrush((New-Color "#ffe8d6" 202))
    $graphics.FillEllipse($blobA, -20, -40, 320, 320)
    $graphics.FillEllipse($blobB, 900, -30, 240, 240)
    $graphics.FillEllipse($blobC, 950, 360, 310, 310)

    Draw-BrandMark $graphics 72 72 126

    $titleFont = New-Font "Segoe UI Semibold" 124 ([System.Drawing.FontStyle]::Bold)
    $bodyFont = New-Font "Segoe UI" 34
    $bodySmallFont = New-Font "Segoe UI" 28
    $panelTitleFont = New-Font "Segoe UI Semibold" 24 ([System.Drawing.FontStyle]::Bold)
    $panelHeadingFont = New-Font "Segoe UI Semibold" 22 ([System.Drawing.FontStyle]::Bold)
    $panelBodyFont = New-Font "Segoe UI" 19
    $textBrush = New-Object System.Drawing.SolidBrush((New-Color "#3b2022"))
    $mutedBrush = New-Object System.Drawing.SolidBrush((New-Color "#755657"))
    $accentBrush = New-Object System.Drawing.SolidBrush((New-Color "#9d3434"))

    $graphics.DrawString("Cicla", $titleFont, $textBrush, 70, 198)
    $graphics.DrawString("Calendario menstrual privado, simple y compartible", $bodyFont, $mutedBrush, 76, 330)
    $graphics.DrawString("Registra sintomas, organiza tu ciclo y comparte un resumen claro.", $bodySmallFont, $mutedBrush, 76, 382)

    $chipX = 72
    $chipX += (Draw-Chip $graphics $chipX 472 "Instalable" "#fff3ea" "#9d3434") + 18
    $chipX += (Draw-Chip $graphics $chipX 472 "Sin servidor" "#edf8f7" "#2e8b84") + 18
    $null = Draw-Chip $graphics $chipX 472 "Resumen para pareja" "#fff3ea" "#9d3434"

    $panelPath = New-RoundedRectPath 764 92 360 420 36
    $panelFill = New-Object System.Drawing.SolidBrush((New-Color "#fffdfb" 245))
    $graphics.FillPath($panelFill, $panelPath)

    $graphics.DrawString("Proximos dias", $panelTitleFont, $accentBrush, 808, 120)

    $cards = @(
      @{ Y = 144; Fill = "#fff2eb"; Title = "Hoy"; Body = "Seguimiento del ciclo y sintomas"; Dot = "#d55b5b" },
      @{ Y = 250; Fill = "#eef8f7"; Title = "Calendario"; Body = "Vista clara para organizarte mejor"; Dot = "#2e8b84" },
      @{ Y = 356; Fill = "#fff7ef"; Title = "Compartir"; Body = "Mensaje listo para tu pareja"; Dot = "#ffb36a" }
    )

    foreach ($card in $cards) {
      $cardPath = New-RoundedRectPath 804 $card.Y 280 88 24
      $cardFill = New-Object System.Drawing.SolidBrush((New-Color $card.Fill))
      $dotBrush = New-Object System.Drawing.SolidBrush((New-Color $card.Dot))

      $graphics.FillPath($cardFill, $cardPath)
      $graphics.FillEllipse($dotBrush, 1008, $card.Y + 30, 20, 20)
      $graphics.DrawString($card.Title, $panelHeadingFont, $textBrush, 834, $card.Y + 24)
      $graphics.DrawString($card.Body, $panelBodyFont, $mutedBrush, 834, $card.Y + 52)

      $cardPath.Dispose()
      $cardFill.Dispose()
      $dotBrush.Dispose()
    }

    Save-Png $bitmap $Path

    $backgroundBrush.Dispose()
    $blobA.Dispose()
    $blobB.Dispose()
    $blobC.Dispose()
    $titleFont.Dispose()
    $bodyFont.Dispose()
    $bodySmallFont.Dispose()
    $panelTitleFont.Dispose()
    $panelHeadingFont.Dispose()
    $panelBodyFont.Dispose()
    $textBrush.Dispose()
    $mutedBrush.Dispose()
    $accentBrush.Dispose()
    $panelFill.Dispose()
    $panelPath.Dispose()
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

Build-Icon 512 (Join-Path $assetsDir "icon-512.png")
Build-Icon 192 (Join-Path $assetsDir "icon-192.png")
Build-Icon 180 (Join-Path $assetsDir "apple-touch-icon.png")
Build-Icon 32 (Join-Path $assetsDir "favicon-32.png")
Build-Icon 256 (Join-Path $assetsDir "favicon-source.png")
Build-OpenGraph (Join-Path $assetsDir "og-image.png")
Save-IcoFromPng (Join-Path $assetsDir "favicon-source.png") (Join-Path $assetsDir "favicon.ico")
Remove-Item -LiteralPath (Join-Path $assetsDir "favicon-source.png")
