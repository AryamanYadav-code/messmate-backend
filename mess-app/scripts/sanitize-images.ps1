# Sanitize Images
Add-Type -AssemblyName System.Drawing

function Sanitize-Image($path) {
    if (Test-Path $path) {
        Write-Host "Sanitizing $path..."
        $img = [System.Drawing.Image]::FromFile($path)
        
        # Create a new bitmap to strip ALL metadata and force 8-bit/32-bit standard format
        $newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
        $g = [System.Drawing.Graphics]::FromImage($newImg)
        $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
        $g.Dispose()
        $img.Dispose()
        
        # Remove old file
        Remove-Item $path
        
        # Save fresh copy
        $newImg.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
        $newImg.Dispose()
        Write-Host "Success!"
    } else {
        Write-Host "File not found: $path" -ForegroundColor Red
    }
}

Sanitize-Image "E:\PROJECT_ALPHA\mess-app\assets\images\icon.png"
Sanitize-Image "E:\PROJECT_ALPHA\mess-app\assets\images\splash-icon.png"
