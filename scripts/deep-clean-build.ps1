# MessMate Deep Clean & Build Script
# This script forcefully removes all build caches and re-initializes the environment to resolve CMake errors.

$projectRoot = Get-Location
$androidDir = Join-Path $projectRoot "android"
$appDir = Join-Path $androidDir "app"

Write-Host "--- 1. Stopping Gradle Daemons ---" -ForegroundColor Cyan
try {
    cmd /c "cd android && gradlew --stop"
} catch {
    Write-Host "No gradle daemons to stop or error stopping." -ForegroundColor Yellow
}

Write-Host "--- 2. Cleaning Build & Cache Folders ---" -ForegroundColor Cyan
$foldersToClean = @(
    (Join-Path $appDir "build"),
    (Join-Path $appDir ".cxx"),
    (Join-Path $androidDir ".gradle"),
    (Join-Path $androidDir "build")
)

foreach ($folder in $foldersToClean) {
    if (Test-Path $folder) {
        Write-Host "Removing $folder..." -ForegroundColor Gray
        Remove-Item -Path $folder -Recurse -Force
    }
}

Write-Host "--- 3. Re-installing Dependencies (npm install) ---" -ForegroundColor Cyan
npm install

Write-Host "--- 4. Running JNI Fix ---" -ForegroundColor Cyan
powershell -File .\fix-jni.ps1

Write-Host "--- 5. Building Production APK (assembleRelease) ---" -ForegroundColor Cyan
Write-Host "This process can take 5-10 minutes. Please do not close the terminal." -ForegroundColor Yellow

cmd /c "cd android && gradlew assembleRelease"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Successful!" -ForegroundColor Green
    $apkPath = Join-Path $appDir "build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host "APK Location: $apkPath" -ForegroundColor Green
    }
} else {
    Write-Host "Build Failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
