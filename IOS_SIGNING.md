# iOS Signing Overview

## What you need

To build an installable iOS package for a real device or TestFlight, GitHub Actions needs:

- An Apple Developer account
- An iOS Distribution certificate exported as `.p12`
- The certificate password
- A provisioning profile for the app bundle id
- An App Store Connect API key if you want automated upload to TestFlight

## Typical GitHub secrets

Recommended secrets:

- `IOS_CERTIFICATE_P12_BASE64`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`
- `IOS_KEYCHAIN_PASSWORD`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY_BASE64`

## Typical CI flow

1. Decode the `.p12` certificate and provisioning profile from Base64
2. Create a temporary keychain on the macOS runner
3. Import the signing certificate into the keychain
4. Install the provisioning profile into `~/Library/MobileDevice/Provisioning Profiles`
5. Build with `xcodebuild archive`
6. Export an `.ipa`
7. Optionally upload to TestFlight using App Store Connect API credentials

## Important

The current workflow only builds an unsigned simulator app:

- It cannot be installed on a real iPhone
- It cannot be uploaded to TestFlight
- It is useful only for CI compile validation and simulator use
