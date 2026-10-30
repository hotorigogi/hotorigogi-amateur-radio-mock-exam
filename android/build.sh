#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-../android-tools/sdk}}"
SDK="$(cd "$SDK" && pwd)"
BT="$SDK/build-tools/36.0.0"
PLATFORM="$SDK/platforms/android-36/android.jar"
mkdir -p build/classes build/dex output
rm -rf build/classes/* build/dex/*
"$BT/aapt2" compile --dir app/src/main/res -o build/resources.zip
"$BT/aapt2" link -o build/base.apk -I "$PLATFORM" --manifest app/src/main/AndroidManifest.xml --min-sdk-version 26 --target-sdk-version 36 --auto-add-overlay -A app/src/main/assets build/resources.zip
java com.sun.tools.javac.Main -encoding UTF-8 -source 8 -target 8 -classpath "$PLATFORM" -d build/classes app/src/main/java/kr/hl0b/radiostudy/MainActivity.java
find build/classes -name '*.class' -print0 | xargs -0 "$BT/d8" --release --min-api 26 --lib "$PLATFORM" --output build/dex
cp build/base.apk build/unsigned.apk
(cd build/dex && zip -q ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
"$BT/apksigner" sign --ks private-signing/radiostudy.p12 --ks-key-alias radiostudy --ks-pass file:private-signing/password.txt --out output/RadioStudy-Android-1.0.0.apk build/aligned.apk
"$BT/apksigner" verify --verbose --print-certs output/RadioStudy-Android-1.0.0.apk > output/signature-verification.txt
"$BT/aapt2" dump badging output/RadioStudy-Android-1.0.0.apk > output/package-verification.txt
sha256sum output/RadioStudy-Android-1.0.0.apk > output/SHA256.txt
