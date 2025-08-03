#Clear The Screen
Write-Host "Lets Clear The Screen First"
cls

# Change directory to android
Set-Location -Path "./android"

# Run gradle clean
Write-Host "Cleaning Android build..."
./gradlew clean

# Go back to project root
Set-Location -Path ".."

# Build and run the Android app
Write-Host "Running the Android app..."
npx react-native run-android
