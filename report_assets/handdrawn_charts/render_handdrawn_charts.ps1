$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$script:Rand = [System.Random]::new(42)
$OutDir = "E:\PROJECT_ALPHA\report_assets\handdrawn_charts"

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height,
    [string]$BackgroundHex
  )
  $bmp = [System.Drawing.Bitmap]::new($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml($BackgroundHex))
  return @{ Bitmap = $bmp; Graphics = $g }
}

function New-Pen {
  param(
    [string]$Hex,
    [float]$Width
  )
  $pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($Hex), $Width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  return $pen
}

function New-Brush {
  param([string]$Hex)
  return [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Hex))
}

function New-AlphaBrush {
  param(
    [string]$Hex,
    [int]$Alpha
  )
  $base = [System.Drawing.ColorTranslator]::FromHtml($Hex)
  return [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($Alpha, $base.R, $base.G, $base.B))
}

function Draw-RuledBackground {
  param(
    [System.Drawing.Graphics]$G,
    [int]$Width,
    [int]$Height,
    [string]$Hex,
    [int]$Step
  )
  $pen = New-Pen $Hex 1
  for ($y = 36; $y -lt $Height; $y += $Step) {
    $G.DrawLine($pen, 0, $y, $Width, $y)
  }
  $pen.Dispose()
}

function Draw-DotGrid {
  param(
    [System.Drawing.Graphics]$G,
    [int]$Width,
    [int]$Height,
    [string]$Hex,
    [int]$Step
  )
  $brush = New-Brush $Hex
  for ($x = 10; $x -lt $Width; $x += $Step) {
    for ($y = 10; $y -lt $Height; $y += $Step) {
      $G.FillEllipse($brush, $x, $y, 2, 2)
    }
  }
  $brush.Dispose()
}

function Offset {
  param([int]$Amount)
  return $script:Rand.Next(-1 * $Amount, $Amount + 1)
}

function Draw-SketchLine {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.Pen]$Pen,
    [float]$X1,
    [float]$Y1,
    [float]$X2,
    [float]$Y2,
    [int]$Jitter = 2
  )
  $G.DrawLine($Pen, $X1 + (Offset $Jitter), $Y1 + (Offset $Jitter), $X2 + (Offset $Jitter), $Y2 + (Offset $Jitter))
  $G.DrawLine($Pen, $X1 + (Offset $Jitter), $Y1 + (Offset $Jitter), $X2 + (Offset $Jitter), $Y2 + (Offset $Jitter))
  $G.DrawLine($Pen, $X1 + (Offset ([Math]::Max(1, [int]($Jitter / 2)))), $Y1 + (Offset ([Math]::Max(1, [int]($Jitter / 2)))), $X2 + (Offset ([Math]::Max(1, [int]($Jitter / 2)))), $Y2 + (Offset ([Math]::Max(1, [int]($Jitter / 2)))))
}

function Draw-SketchRect {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.RectangleF]$Rect,
    [string]$FillHex,
    [string]$StrokeHex,
    [float]$StrokeWidth = 3
  )
  $shadowBrush = New-AlphaBrush "#7b8794" 30
  $brush = New-Brush $FillHex
  $pen = New-Pen $StrokeHex $StrokeWidth
  $G.FillRectangle($shadowBrush, $Rect.Left + 7, $Rect.Top + 7, $Rect.Width, $Rect.Height)
  $G.FillRectangle($brush, $Rect)
  Draw-SketchLine $G $pen $Rect.Left $Rect.Top $Rect.Right $Rect.Top
  Draw-SketchLine $G $pen $Rect.Right $Rect.Top $Rect.Right $Rect.Bottom
  Draw-SketchLine $G $pen $Rect.Right $Rect.Bottom $Rect.Left $Rect.Bottom
  Draw-SketchLine $G $pen $Rect.Left $Rect.Bottom $Rect.Left $Rect.Top
  $shadowBrush.Dispose()
  $brush.Dispose()
  $pen.Dispose()
}

function Draw-Arrow {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Hex,
    [float]$X1,
    [float]$Y1,
    [float]$X2,
    [float]$Y2
  )
  $pen = New-Pen $Hex 4
  Draw-SketchLine $G $pen $X1 $Y1 $X2 $Y2
  Draw-SketchLine $G $pen $X2 $Y2 ($X2 - 14) ($Y2 - 10)
  Draw-SketchLine $G $pen $X2 $Y2 ($X2 - 14) ($Y2 + 10)
  $pen.Dispose()
}

function Draw-Text {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Text,
    [float]$Size,
    [string]$Hex,
    [float]$X,
    [float]$Y,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  $font = [System.Drawing.Font]::new("Segoe Print", $Size, $Style)
  $brush = New-Brush $Hex
  $G.DrawString($Text, $font, $brush, $X, $Y)
  $font.Dispose()
  $brush.Dispose()
}

function Draw-WrappedText {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Text,
    [float]$Size,
    [string]$Hex,
    [System.Drawing.RectangleF]$Rect
  )
  $font = [System.Drawing.Font]::new("Segoe Print", $Size)
  $brush = New-Brush $Hex
  $format = [System.Drawing.StringFormat]::new()
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $G.DrawString($Text, $font, $brush, $Rect, $format)
  $format.Dispose()
  $font.Dispose()
  $brush.Dispose()
}

function Draw-NotebookPage {
  param(
    [System.Drawing.Graphics]$G,
    [int]$Width,
    [int]$Height,
    [string]$LineHex,
    [int]$LineStep = 34,
    [int]$MarginX = 110
  )
  Draw-RuledBackground $G $Width $Height $LineHex $LineStep

  $marginPen = New-Pen "#e76f51" 2
  Draw-SketchLine $G $marginPen $MarginX 40 $MarginX ($Height - 40) 1
  $marginPen.Dispose()

  $holeBrush = New-AlphaBrush "#b8c4d0" 70
  $holePen = New-Pen "#bcccdc" 1
  foreach ($y in @(150, 350, 550, 750, 920)) {
    $G.FillEllipse($holeBrush, 36, $y, 28, 28)
    $G.DrawEllipse($holePen, 36, $y, 28, 28)
  }
  $holeBrush.Dispose()
  $holePen.Dispose()

  $edgePen = New-Pen "#e9ecef" 3
  Draw-SketchLine $G $edgePen 75 0 75 $Height 1
  $edgePen.Dispose()
}

function Draw-Highlighter {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Hex,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height
  )
  $brush = New-AlphaBrush $Hex 85
  $G.FillRectangle($brush, $X, $Y, $Width, $Height)
  $brush.Dispose()
}

function Draw-Tape {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$Width = 90,
    [float]$Height = 26
  )
  $brush = New-AlphaBrush "#f6e7b0" 150
  $pen = New-Pen "#d8c37d" 1
  $rect = [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height)
  $G.FillRectangle($brush, $rect)
  Draw-SketchLine $G $pen $rect.Left $rect.Top $rect.Right $rect.Top 1
  Draw-SketchLine $G $pen $rect.Right $rect.Top $rect.Right $rect.Bottom 1
  Draw-SketchLine $G $pen $rect.Right $rect.Bottom $rect.Left $rect.Bottom 1
  Draw-SketchLine $G $pen $rect.Left $rect.Bottom $rect.Left $rect.Top 1
  $brush.Dispose()
  $pen.Dispose()
}

function Draw-StarDoodle {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Hex,
    [float]$X,
    [float]$Y,
    [float]$Size = 16
  )
  $pen = New-Pen $Hex 3
  Draw-SketchLine $G $pen ($X - $Size) $Y ($X + $Size) $Y 1
  Draw-SketchLine $G $pen $X ($Y - $Size) $X ($Y + $Size) 1
  Draw-SketchLine $G $pen ($X - ($Size * 0.7)) ($Y - ($Size * 0.7)) ($X + ($Size * 0.7)) ($Y + ($Size * 0.7)) 1
  Draw-SketchLine $G $pen ($X - ($Size * 0.7)) ($Y + ($Size * 0.7)) ($X + ($Size * 0.7)) ($Y - ($Size * 0.7)) 1
  $pen.Dispose()
}

function Save-Canvas {
  param(
    [hashtable]$Canvas,
    [string]$Path
  )
  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Dispose()
}

function Render-Week9 {
  $canvas = New-Canvas 1600 1000 "#fbf7ea"
  $g = $canvas.Graphics
  Draw-NotebookPage $g 1600 1000 "#d9e2ec" 36 110
  Draw-Highlighter $g "#fff176" 78 58 360 28
  Draw-Tape $g 250 24 100 24
  Draw-Tape $g 1260 28 96 24

  $bluePen = New-Pen "#173f5f" 4
  Draw-SketchLine $g $bluePen 88 112 1500 96
  Draw-SketchLine $g $bluePen 92 120 1504 104
  $bluePen.Dispose()

  Draw-Text $g "Week 9: Iteration Log" 31 "#183153" 88 44 ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "Qualitative impact chart from the reported build - test - feedback - refine cycle" 17 "#34506d" 92 100
  Draw-Text $g "draft notes" 12 "#8d99ae" 1368 58

  $axisPen = New-Pen "#264653" 5
  Draw-SketchLine $g $axisPen 150 752 150 300
  Draw-SketchLine $g $axisPen 150 752 1450 752
  $axisPen.Dispose()
  Draw-Text $g "Improvement confidence" 15 "#22313f" 42 432
  Draw-Text $g "Iteration number" 15 "#22313f" 1222 772

  $trendPen = New-Pen "#264653" 5
  $points = @(
    [System.Drawing.PointF]::new(248, 710),
    [System.Drawing.PointF]::new(458, 694),
    [System.Drawing.PointF]::new(668, 648),
    [System.Drawing.PointF]::new(894, 584),
    [System.Drawing.PointF]::new(1148, 514),
    [System.Drawing.PointF]::new(1358, 438)
  )
  for ($i = 0; $i -lt ($points.Count - 1); $i++) {
    Draw-SketchLine $g $trendPen $points[$i].X $points[$i].Y $points[$i + 1].X $points[$i + 1].Y
  }
  $trendPen.Dispose()

  $circlePen = New-Pen "#264653" 3
  $circleBrush = New-Brush "#fbf7ea"
  $numBrush = New-Brush "#22313f"
  $numFont = [System.Drawing.Font]::new("Comic Sans MS", 16, [System.Drawing.FontStyle]::Bold)
  foreach ($index in 0..5) {
    $pt = $points[$index]
    $g.FillEllipse($circleBrush, $pt.X - 16, $pt.Y - 16, 32, 32)
    $g.DrawEllipse($circlePen, $pt.X - 16, $pt.Y - 16, 32, 32)
    $g.DrawString([string]($index + 1), $numFont, $numBrush, $pt.X - 7, $pt.Y - 12)
  }
  $numFont.Dispose()
  $numBrush.Dispose()
  $circleBrush.Dispose()
  $circlePen.Dispose()

  Draw-Text $g "less friction" 13 "#4a5d73" 212 638
  Draw-Text $g "higher trust" 13 "#4a5d73" 918 455
  Draw-Text $g "better flow" 13 "#4a5d73" 1296 272
  Draw-StarDoodle $g "#f4a261" 118 74 10

  $cards = @(
    @{ Rect = [System.Drawing.RectangleF]::new(180, 205, 240, 110); Fill = "#fff6b8"; Title = "1. Menu availability"; Body = "Badges show Available / Limited / Sold Out. Result: fewer wasted taps and faster decisions." },
    @{ Rect = [System.Drawing.RectangleF]::new(445, 190, 260, 118); Fill = "#ffd6a5"; Title = "2. Time-slot picker"; Body = "Moved to a mandatory step before payment. Result: 100% of testers selected a slot." },
    @{ Rect = [System.Drawing.RectangleF]::new(730, 178, 280, 122); Fill = "#caffbf"; Title = "3. Payment feedback"; Body = "Spinner + success state after UPI scan. Result: payment uncertainty dropped." },
    @{ Rect = [System.Drawing.RectangleF]::new(1082, 204, 270, 115); Fill = "#bde0fe"; Title = "4. Dashboard alert"; Body = "Chime + amber highlight for near-term orders. Result: staff noticed new orders faster." },
    @{ Rect = [System.Drawing.RectangleF]::new(280, 812, 300, 115); Fill = "#f1c0e8"; Title = "5. Staff earnings tab"; Body = "Revenue, order count, and item-level sales. Result: better daily quantity planning." },
    @{ Rect = [System.Drawing.RectangleF]::new(830, 800, 330, 118); Fill = "#d8f3dc"; Title = "6. Checkout summary"; Body = "One clear page and one place-order action. Result: completion rate improved." }
  )

  foreach ($card in $cards) {
    Draw-SketchRect $g $card.Rect $card.Fill "#3d405b"
    Draw-Tape $g ($card.Rect.Left + 18) ($card.Rect.Top - 12) 72 20
    Draw-Text $g $card.Title 16 "#22313f" ($card.Rect.Left + 18) ($card.Rect.Top + 16) ([System.Drawing.FontStyle]::Bold)
    Draw-WrappedText $g $card.Body 12 "#2f4156" ([System.Drawing.RectangleF]::new($card.Rect.Left + 18, $card.Rect.Top + 48, $card.Rect.Width - 30, $card.Rect.Height - 40))
  }

  $dashPen = New-Pen "#ef476f" 3
  $dashPen.DashPattern = @(6.0, 7.0)
  Draw-SketchLine $g $dashPen 420 315 245 690 1
  Draw-SketchLine $g $dashPen 705 310 455 676 1
  Draw-SketchLine $g $dashPen 1010 305 665 632 1
  Draw-SketchLine $g $dashPen 1210 320 890 568 1
  Draw-SketchLine $g $dashPen 580 812 1145 500 1
  Draw-SketchLine $g $dashPen 995 800 1360 425 1
  $dashPen.Dispose()

  Draw-Text $g "Interpretation note: the trend line is qualitative and derived from the report outcomes, not from numeric benchmark scores." 12 "#4a5d73" 94 940
  Save-Canvas $canvas (Join-Path $OutDir "week9_iteration_log_handdrawn.png")
}

function Render-Week10 {
  $canvas = New-Canvas 1600 1000 "#fffaf0"
  $g = $canvas.Graphics
  Draw-NotebookPage $g 1600 1000 "#e6eef6" 34 110
  Draw-Highlighter $g "#c8f7c5" 86 58 520 28
  Draw-Tape $g 300 24 100 24
  Draw-Tape $g 1228 30 96 24

  $headerPen = New-Pen "#0f4c5c" 4
  Draw-SketchLine $g $headerPen 88 104 1486 96
  Draw-SketchLine $g $headerPen 94 112 1492 103
  $headerPen.Dispose()

  Draw-Text $g "Week 10: Ethics and Inclusivity" 31 "#20354c" 92 44 ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "Hand-drawn risk-to-safeguard chart for a responsible college canteen platform" 17 "#3e5671" 92 100
  Draw-Text $g "ethics check" 12 "#8d99ae" 1334 58
  Draw-StarDoodle $g "#90be6d" 118 74 10

  Draw-SketchRect $g ([System.Drawing.RectangleF]::new(180, 205, 470, 620)) "#ffe8d6" "#34495e"
  Draw-SketchRect $g ([System.Drawing.RectangleF]::new(950, 205, 470, 620)) "#d8f3dc" "#34495e"
  Draw-Text $g "Risks Raised in the Report" 20 "#243b53" 310 220 ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "Safeguards and Inclusive Design" 20 "#243b53" 1065 220 ([System.Drawing.FontStyle]::Bold)

  $leftCards = @(
    @{ Rect = [System.Drawing.RectangleF]::new(245, 290, 345, 100); Fill = "#fff1c1"; Title = "Fraud or fake buyers"; Body = "False orders can create waste and operational chaos." },
    @{ Rect = [System.Drawing.RectangleF]::new(245, 435, 345, 100); Fill = "#ffd6d6"; Title = "Data leakage"; Body = "Phone numbers, UPI details, and wallet history need protection." },
    @{ Rect = [System.Drawing.RectangleF]::new(245, 580, 345, 100); Fill = "#e9d8fd"; Title = "Digital exclusion"; Body = "Low-tech or visually challenged students could be left out." },
    @{ Rect = [System.Drawing.RectangleF]::new(245, 725, 345, 100); Fill = "#cde7ff"; Title = "Job displacement fear"; Body = "Staff may worry that automation replaces their role." }
  )
  $rightCards = @(
    @{ Rect = [System.Drawing.RectangleF]::new(1015, 290, 350, 100); Fill = "#fefae0"; Title = "Confirmed payment first"; Body = "UPI confirmation before processing blocks no-show orders." },
    @{ Rect = [System.Drawing.RectangleF]::new(1015, 435, 350, 100); Fill = "#ddf4ff"; Title = "Security controls"; Body = "JWT expiry, bcrypt hashing, encryption, and limited retention." },
    @{ Rect = [System.Drawing.RectangleF]::new(1015, 580, 350, 100); Fill = "#f1f7b5"; Title = "Accessibility choices"; Body = "Basic Android support, text scaling, contrast, language options." },
    @{ Rect = [System.Drawing.RectangleF]::new(1015, 725, 350, 100); Fill = "#f8d5c6"; Title = "Workflow enhancement"; Body = "Staff still prepare, serve, and manage daily operations." }
  )

  for ($i = 0; $i -lt $leftCards.Count; $i++) {
    $left = $leftCards[$i]
    $right = $rightCards[$i]
    Draw-SketchRect $g $left.Rect $left.Fill "#34495e"
    Draw-SketchRect $g $right.Rect $right.Fill "#34495e"
    Draw-Tape $g ($left.Rect.Left + 14) ($left.Rect.Top - 11) 68 18
    Draw-Tape $g ($right.Rect.Left + 14) ($right.Rect.Top - 11) 68 18
    Draw-Text $g $left.Title 16 "#243b53" ($left.Rect.Left + 18) ($left.Rect.Top + 16) ([System.Drawing.FontStyle]::Bold)
    Draw-Text $g $right.Title 16 "#243b53" ($right.Rect.Left + 18) ($right.Rect.Top + 16) ([System.Drawing.FontStyle]::Bold)
    Draw-WrappedText $g $left.Body 12 "#334e68" ([System.Drawing.RectangleF]::new($left.Rect.Left + 18, $left.Rect.Top + 46, $left.Rect.Width - 26, 50))
    Draw-WrappedText $g $right.Body 12 "#334e68" ([System.Drawing.RectangleF]::new($right.Rect.Left + 18, $right.Rect.Top + 46, $right.Rect.Width - 26, 50))
    Draw-Arrow $g "#ef476f" ($left.Rect.Right + 10) ($left.Rect.Top + 45) ($right.Rect.Left - 20) ($right.Rect.Top + 45)
  }

  Draw-SketchRect $g ([System.Drawing.RectangleF]::new(635, 826, 660, 126)) "#fff2cc" "#34495e"
  Draw-Tape $g 900 820 84 20
  Draw-Text $g "Positive impact: more trust, less stress, fairer access," 14 "#243b53" 670 856 ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "and calmer work conditions." 14 "#243b53" 670 884 ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "Stakeholders named in the report: students, canteen staff," 10 "#486581" 670 906
  Draw-Text $g "faculty, administration, and management." 10 "#486581" 670 926
  Save-Canvas $canvas (Join-Path $OutDir "week10_ethics_inclusivity_handdrawn.png")
}

function Render-Week11 {
  $canvas = New-Canvas 1600 1000 "#fcf7ff"
  $g = $canvas.Graphics
  Draw-NotebookPage $g 1600 1000 "#ece3f7" 35 110
  Draw-Highlighter $g "#ffe082" 86 58 500 28
  Draw-Tape $g 278 24 102 24
  Draw-Tape $g 1212 28 98 24

  $headerPen = New-Pen "#1d3557" 4
  Draw-SketchLine $g $headerPen 90 105 1490 98
  Draw-SketchLine $g $headerPen 96 113 1496 105
  $headerPen.Dispose()

  Draw-Text $g "Week 11: Digital Prototyping" 31 "#1f2d3d" 92 44 ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "Hand-drawn three-tier stack chart for the working SRM Kitchen prototype" 17 "#415a77" 92 100
  Draw-Text $g "stack sketch" 12 "#8d99ae" 1342 58
  Draw-StarDoodle $g "#ffb703" 118 74 10

  $tiers = @(
    @{ Rect = [System.Drawing.RectangleF]::new(165, 210, 1270, 165); Fill = "#d7f9f1"; Title = "Tier 1: Frontend Experience Layer"; Left = @("Student Portal", "React.js + Vite", "Tailwind CSS"); Mid = @("App Flow", "Redux Toolkit state", "React Router v6"); Right = @("Token + Alerts", "QRCode.js pickup token", "React Toastify notices"); Far = @("Role Views", "student / staff / admin routes", "mobile-first layout") },
    @{ Rect = [System.Drawing.RectangleF]::new(210, 420, 1190, 155); Fill = "#ffe5ec"; Title = "Tier 2: Backend and Realtime Logic"; Left = @("Node.js + Express.js APIs", "REST endpoints for auth, menu, orders, wallet"); Mid = @("JWT + bcryptjs security", "role-based access and password hashing"); Right = @("Socket.IO updates", "live order status between students and kitchen") },
    @{ Rect = [System.Drawing.RectangleF]::new(250, 630, 1108, 170); Fill = "#fff1b6"; Title = "Tier 3: Database and Domain Models"; Left = @("MongoDB Atlas + Mongoose", "cloud database, schema validation, ODM layer"); Mid = @("Core models", "User, MenuItem, Order, Wallet, Feedback"); Right = @("Order workflow", "pending -> preparing -> ready -> collected / cancelled") }
  )

  foreach ($tier in $tiers) {
    Draw-SketchRect $g $tier.Rect $tier.Fill "#2b2d42"
    Draw-Tape $g ($tier.Rect.Left + 36) ($tier.Rect.Top - 12) 82 20
    Draw-Text $g $tier.Title 20 "#213547" ($tier.Rect.Left + 470) ($tier.Rect.Top + 18) ([System.Drawing.FontStyle]::Bold)
    if ($tier.Rect.Top -eq 210) {
      Draw-Text $g $tier.Left[0] 16 "#213547" 210 285 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Left[1] 12 "#3a506b" 210 313
      Draw-Text $g $tier.Left[2] 12 "#3a506b" 210 336
      Draw-Text $g $tier.Mid[0] 16 "#213547" 470 285 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Mid[1] 12 "#3a506b" 470 313
      Draw-Text $g $tier.Mid[2] 12 "#3a506b" 470 336
      Draw-Text $g $tier.Right[0] 16 "#213547" 760 285 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Right[1] 12 "#3a506b" 760 313
      Draw-Text $g $tier.Right[2] 12 "#3a506b" 760 336
      Draw-Text $g $tier.Far[0] 16 "#213547" 1100 285 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Far[1] 12 "#3a506b" 1100 313
      Draw-Text $g $tier.Far[2] 12 "#3a506b" 1100 336
    }
    elseif ($tier.Rect.Top -eq 420) {
      Draw-Text $g $tier.Left[0] 16 "#213547" 255 492 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Left[1] 12 "#3a506b" 255 522
      Draw-Text $g $tier.Mid[0] 16 "#213547" 700 492 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Mid[1] 12 "#3a506b" 700 522
      Draw-Text $g $tier.Right[0] 16 "#213547" 1070 492 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Right[1] 12 "#3a506b" 1070 522
    }
    else {
      Draw-Text $g $tier.Left[0] 16 "#213547" 295 700 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Left[1] 12 "#3a506b" 295 730
      Draw-Text $g $tier.Mid[0] 16 "#213547" 660 700 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Mid[1] 12 "#3a506b" 660 730
      Draw-Text $g $tier.Right[0] 16 "#213547" 1025 700 ([System.Drawing.FontStyle]::Bold)
      Draw-Text $g $tier.Right[1] 12 "#3a506b" 1025 730
    }
  }

  Draw-Arrow $g "#ef476f" 800 376 800 418
  Draw-Arrow $g "#ef476f" 800 576 800 628
  Draw-Text $g "API calls, auth, status sync" 12 "#5c677d" 830 395
  Draw-Text $g "persistence, menu data, transactions" 12 "#5c677d" 830 600

  Draw-SketchRect $g ([System.Drawing.RectangleF]::new(115, 832, 510, 128)) "#d0ebff" "#2b2d42"
  Draw-Tape $g 250 820 84 20
  Draw-Text $g "Development tools" 18 "#213547" 145 855 ([System.Drawing.FontStyle]::Bold)
  Draw-WrappedText $g "GitHub, MongoDB Compass, Postman, Figma, VS Code + ESLint" 12 "#3a506b" ([System.Drawing.RectangleF]::new(145, 886, 450, 56))

  Draw-SketchRect $g ([System.Drawing.RectangleF]::new(825, 832, 625, 128)) "#e4c1f9" "#2b2d42"
  Draw-Tape $g 1080 820 84 20
  Draw-Text $g "System view from the report" 18 "#213547" 857 855 ([System.Drawing.FontStyle]::Bold)
  Draw-WrappedText $g "Student Portal + Kitchen Hub + Admin Oversight in one synchronized working product" 12 "#3a506b" ([System.Drawing.RectangleF]::new(857, 886, 560, 56))

  $orangePen = New-Pen "#f4a261" 4
  Draw-SketchLine $g $orangePen 185 190 220 170
  Draw-SketchLine $g $orangePen 220 170 258 183
  Draw-SketchLine $g $orangePen 220 170 246 144
  $orangePen.Dispose()
  Draw-Text $g "working prototype, not just static screens" 12 "#5c677d" 286 170
  Save-Canvas $canvas (Join-Path $OutDir "week11_digital_prototype_handdrawn.png")
}

Render-Week9
Render-Week10
Render-Week11
