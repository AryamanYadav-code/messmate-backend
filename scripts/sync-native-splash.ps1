$resDir = "E:\PROJECT_ALPHA\mess-app\android\app\src\main\res"
$sourceAsset = "E:\PROJECT_ALPHA\mess-app\assets\images\splash_new.png"
$targetName = "splashscreen_logo.png"

$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

if (-not (Test-Path $sourceAsset)) {
    Write-Error "Source asset not found: $sourceAsset"
    exit 1
}

foreach ($density in $densities) {
    $targetDir = Join-Path $resDir "drawable-$density"
    if (Test-Path $targetDir) {
        $targetPath = Join-Path $targetDir $targetName
        Write-Host "Syncing splash to $targetPath..."
        Copy-Item -Path $sourceAsset -Destination $targetPath -Force
    } else {
        Write-Warning "Target directory not found: $targetDir"
    }
}

Write-Host "Native splash screen sync complete!"
Write-Host "IMPORTANT: Please 'Clean Project' and 'Rebuild' in Android Studio to see the changes."
