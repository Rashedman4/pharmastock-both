import * as AppleAuthentication from 'expo-apple-authentication';

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  return credential;
}

export async function isAppleAuthAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}
