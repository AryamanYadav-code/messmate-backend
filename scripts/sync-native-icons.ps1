$resDir = "E:\PROJECT_ALPHA\mess-app\android\app\src\main\res"
$assetsDir = "E:\PROJECT_ALPHA\mess-app\assets\images"

$mappings = @(
    @("icon.png", "ic_launcher.png"),
    @("icon.png", "ic_launcher_round.png"),
    @("android-icon-foreground.png", "ic_launcher_foreground.png"),
    @("android-icon-background.png", "ic_launcher_background.png"),
    @("android-icon-monochrome.png", "ic_launcher_monochrome.png")
)

$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

foreach ($density in $densities) {
    $targetDir = Join-Path $resDir "mipmap-$density"
    if (Test-Path $targetDir) {
        Write-Host "Syncing to $targetDir..."
        
        # Remove old webp files to avoid duplicates/stale assets
        Get-ChildItem -Path $targetDir -Filter "*.webp" | Remove-Item -Force

        # Copy new png assets
        foreach ($mapping in $mappings) {
            $source = $mapping[0]
            $targetName = $mapping[1]
            $sourcePath = Join-Path $assetsDir $source
            $targetPath = Join-Path $targetDir $targetName
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
        }
    }
}

Write-Host "Native icon sync complete!"
