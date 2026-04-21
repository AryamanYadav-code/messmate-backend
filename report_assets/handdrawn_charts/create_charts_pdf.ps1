$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$outDir = "E:\PROJECT_ALPHA\report_assets\handdrawn_charts"
$images = @(
  (Join-Path $outDir "week9_iteration_log_handdrawn.png"),
  (Join-Path $outDir "week10_ethics_inclusivity_handdrawn.png"),
  (Join-Path $outDir "week11_digital_prototype_handdrawn.png")
)
$pdfPath = Join-Path $outDir "handdrawn_charts_3pages.pdf"

foreach ($image in $images) {
  if (-not (Test-Path -LiteralPath $image)) {
    throw "Missing image: $image"
  }
}

function Get-JpegBytes {
  param([string]$Path)

  $image = [System.Drawing.Image]::FromFile($Path)
  try {
    $stream = [System.IO.MemoryStream]::new()
    try {
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq "image/jpeg" } |
        Select-Object -First 1
      $encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
      $qualityEncoder = [System.Drawing.Imaging.Encoder]::Quality
      $encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new($qualityEncoder, 92L)
      $image.Save($stream, $codec, $encoderParams)
      return @{
        Width = [int]$image.Width
        Height = [int]$image.Height
        Bytes = $stream.ToArray()
      }
    }
    finally {
      $stream.Dispose()
    }
  }
  finally {
    $image.Dispose()
  }
}

function Add-AsciiObject {
  param(
    [System.IO.MemoryStream]$Stream,
    [System.Collections.Generic.List[int]]$Offsets,
    [int]$ObjectNumber,
    [string]$Body
  )

  $Offsets.Add([int]$Stream.Position)
  $text = "$ObjectNumber 0 obj`n$Body`nendobj`n"
  $bytes = [System.Text.Encoding]::ASCII.GetBytes($text)
  $Stream.Write($bytes, 0, $bytes.Length)
}

function Add-StreamObject {
  param(
    [System.IO.MemoryStream]$Stream,
    [System.Collections.Generic.List[int]]$Offsets,
    [int]$ObjectNumber,
    [string]$Dictionary,
    [byte[]]$Data
  )

  $Offsets.Add([int]$Stream.Position)
  $header = [System.Text.Encoding]::ASCII.GetBytes("$ObjectNumber 0 obj`n<< $Dictionary /Length $($Data.Length) >>`nstream`n")
  $footer = [System.Text.Encoding]::ASCII.GetBytes("`nendstream`nendobj`n")
  $Stream.Write($header, 0, $header.Length)
  $Stream.Write($Data, 0, $Data.Length)
  $Stream.Write($footer, 0, $footer.Length)
}

$pageWidth = 842
$pageHeight = 595
$margin = 18

$imageEntries = foreach ($imagePath in $images) {
  Get-JpegBytes -Path $imagePath
}

$objectCount = 2 + ($images.Count * 3) + $images.Count
$offsets = [System.Collections.Generic.List[int]]::new()
$pdf = [System.IO.MemoryStream]::new()

try {
  $header = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4`n%AAAA`n")
  $pdf.Write($header, 0, $header.Length)

  Add-AsciiObject -Stream $pdf -Offsets $offsets -ObjectNumber 1 -Body "<< /Type /Catalog /Pages 2 0 R >>"

  $pageRefs = for ($index = 0; $index -lt $images.Count; $index++) {
    $pageObject = 3 + ($index * 4)
    "$pageObject 0 R"
  }
  Add-AsciiObject -Stream $pdf -Offsets $offsets -ObjectNumber 2 -Body "<< /Type /Pages /Count $($images.Count) /Kids [ $($pageRefs -join ' ') ] >>"

  for ($index = 0; $index -lt $images.Count; $index++) {
    $pageObject = 3 + ($index * 4)
    $contentObject = $pageObject + 1
    $imageObject = $pageObject + 2
    $entry = $imageEntries[$index]

    $availableWidth = $pageWidth - (2 * $margin)
    $availableHeight = $pageHeight - (2 * $margin)
    $scale = [Math]::Min($availableWidth / $entry.Width, $availableHeight / $entry.Height)
    $drawWidth = [Math]::Round($entry.Width * $scale, 2)
    $drawHeight = [Math]::Round($entry.Height * $scale, 2)
    $x = [Math]::Round(($pageWidth - $drawWidth) / 2, 2)
    $y = [Math]::Round(($pageHeight - $drawHeight) / 2, 2)
    $content = "q`n$drawWidth 0 0 $drawHeight $x $y cm`n/Im1 Do`nQ"
    $contentBytes = [System.Text.Encoding]::ASCII.GetBytes($content)

    Add-AsciiObject -Stream $pdf -Offsets $offsets -ObjectNumber $pageObject -Body "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 $pageWidth $pageHeight] /Resources << /XObject << /Im1 $imageObject 0 R >> >> /Contents $contentObject 0 R >>"
    Add-StreamObject -Stream $pdf -Offsets $offsets -ObjectNumber $contentObject -Dictionary "" -Data $contentBytes
    Add-StreamObject -Stream $pdf -Offsets $offsets -ObjectNumber $imageObject -Dictionary "/Type /XObject /Subtype /Image /Width $($entry.Width) /Height $($entry.Height) /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode" -Data $entry.Bytes
    Add-AsciiObject -Stream $pdf -Offsets $offsets -ObjectNumber ($pageObject + 3) -Body "<< /Producer (Codex) /Title (Handdrawn Charts) >>"
  }

  $xrefStart = [int]$pdf.Position
  $xrefHeader = [System.Text.Encoding]::ASCII.GetBytes("xref`n0 $($objectCount + 1)`n")
  $pdf.Write($xrefHeader, 0, $xrefHeader.Length)
  $freeEntry = [System.Text.Encoding]::ASCII.GetBytes("0000000000 65535 f `n")
  $pdf.Write($freeEntry, 0, $freeEntry.Length)

  foreach ($offset in $offsets) {
    $entryText = "{0:0000000000} 00000 n `n" -f $offset
    $entryBytes = [System.Text.Encoding]::ASCII.GetBytes($entryText)
    $pdf.Write($entryBytes, 0, $entryBytes.Length)
  }

  $trailer = [System.Text.Encoding]::ASCII.GetBytes("trailer`n<< /Size $($objectCount + 1) /Root 1 0 R >>`nstartxref`n$xrefStart`n%%EOF")
  $pdf.Write($trailer, 0, $trailer.Length)

  [System.IO.File]::WriteAllBytes($pdfPath, $pdf.ToArray())
}
finally {
  $pdf.Dispose()
}
