# Stream Video SDK - Disabled

## Why is stream.ts disabled?

The `stream.ts` file has been renamed to `stream.ts.disabled` because it imports the `@stream-io/video-react-native-sdk` package at the module level, which causes a critical runtime error:

```
(0 , r(...).requireNativeComponent) is not a function
```

## Root Cause

The Stream Video SDK is a heavyweight native module that requires:
1. Proper native linking (iOS Podfile, Android Gradle)
2. Native code compilation
3. Expo prebuild (not available in managed Expo workflow)

When imported at the top level of a module, the SDK attempts to initialize native components immediately, causing the app to crash if the native modules aren't properly linked.

## Solution Options

### Option 1: Use Expo Go Compatible Alternative
Replace Stream SDK with a lightweight, Expo-compatible video calling solution:
- `expo-av` for basic video
- `twilio-video` with Expo compatibility
- Custom WebRTC implementation

### Option 2: Eject to Bare Workflow
If Stream SDK is required:
1. Run `npx expo prebuild` to generate native folders
2. Configure iOS Podfile to include Stream SDK
3. Configure Android Gradle dependencies
4. Test on physical devices (not Expo Go)

### Option 3: Lazy Load with Dynamic Imports
```typescript
// Instead of top-level import:
// import { StreamVideoClient } from '@stream-io/video-react-native-sdk'; // ❌

// Use dynamic import with error handling:
async function initializeStreamSDK() {
  try {
    const StreamSDK = await import('@stream-io/video-react-native-sdk'); // ✅
    return StreamSDK.StreamVideoClient;
  } catch (error) {
    console.error('Stream SDK not available:', error);
    return null;
  }
}
```

## Current Status

- ✅ App launches successfully without Stream SDK
- ✅ All calling UI components work (simulated calls)
- ❌ Real-time video calling not functional (was never implemented)

## To Re-enable Stream SDK

1. Ensure you're using bare workflow (not Expo Go)
2. Add proper native configuration
3. Rename `stream.ts.disabled` back to `stream.ts`
4. Use dynamic imports with proper error boundaries
5. Test on physical devices

## Alternative: Mock Implementation

For development/demo purposes, use the existing mock calling system in `calling.ts` which doesn't require native modules.
