$paths = @(
    "android/app/build/generated/source/codegen/jni",
    "android/app/build/generated/source/codegen/jni/react/renderer/components/view",
    "android/app/build/generated/source/codegen/jni/react/renderer/components/text",
    "android/app/build/generated/source/codegen/jni/react/renderer/components/image"
)

foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        Write-Host "Created missing JNI path: $path"
    } else {
        Write-Host "Path already exists: $path"
    }
}
