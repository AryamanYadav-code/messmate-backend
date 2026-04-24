# Force SRM Kitchen Splash Screen into Native Android Folders
Add-Type -AssemblyName System.Drawing

$sourceJpg = "E:\PROJECT_ALPHA\mess-app\assets\images\srm_kitchen_logo.jpg"
$resDir = "E:\PROJECT_ALPHA\mess-app\android\app\src\main\res"

if (!(Test-Path $sourceJpg)) {
    Write-Host "Source logo not found at $sourceJpg" -ForegroundColor Red
    exit
}

Write-Host "Loading SRM Kitchen logo from $sourceJpg..."
$img = [System.Drawing.Image]::FromFile($sourceJpg)

# Create a clean PNG version in memory
$newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$g.Dispose()
$img.Dispose()

# Define density folders
$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

foreach ($density in $densities) {
    $targetFile = "$resDir\drawable-$density\splashscreen_logo.png"
    
    if (Test-Path $targetFile) {
        Write-Host "Overwriting MessMate logo in drawable-$density..."
        # We save directly to the target path as PNG
        $newImg.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Success: $targetFile" -ForegroundColor Green
    } else {
        Write-Host "Target not found: $targetFile (Skipping)" -ForegroundColor Yellow
    }
}

$newImg.Dispose()
Write-Host "`nNative splash screen branding forced to SRM Kitchen!" -ForegroundColor Cyan
Write-Host "IMPORTANT: Please Clean and Rebuild in Android Studio now."
