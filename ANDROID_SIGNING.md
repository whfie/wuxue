# Android Signing

## GitHub Secrets

Add these repository secrets before building a signed Android release:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

`ANDROID_KEYSTORE_BASE64` is the Base64 content of your `.jks` or `.keystore` file.

## Create a keystore

Example:

```powershell
keytool -genkeypair -v -keystore wuxue-release.jks -alias wuxue -keyalg RSA -keysize 2048 -validity 10000
```

## Convert keystore to Base64

Example:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("wuxue-release.jks")) | Set-Content keystore.base64
```

Copy the content of `keystore.base64` into the `ANDROID_KEYSTORE_BASE64` secret.

## Build behavior

- If Android signing secrets exist, GitHub Actions builds signed `release apk` and `aab`
- If they do not exist, the release build may complete but the APK is not suitable for normal installation
