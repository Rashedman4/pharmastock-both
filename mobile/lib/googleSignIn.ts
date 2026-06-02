import {
  GoogleSignin,
  statusCodes,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';

let configured = false;

export function configureGoogleSignIn() {
  if (configured) return;
  GoogleSignin.configure({
    // Web client ID — used for ID token verification on the backend
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // iOS native client ID (only needed on iOS)
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    // Request an ID token that the backend can verify
    offlineAccess: false,
  });
  configured = true;
}

export interface GoogleSignInResult {
  idToken: string;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  configureGoogleSignIn();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response: SignInResponse = await GoogleSignin.signIn();

  // v13+ returns a discriminated union
  if (response.type === 'cancelled') {
    throw Object.assign(new Error('Sign in cancelled'), { code: statusCodes.SIGN_IN_CANCELLED });
  }

  // Get the actual id_token — signIn() returns user data, getTokens() returns OAuth tokens
  const { idToken } = await GoogleSignin.getTokens();

  if (!idToken) {
    throw new Error('No ID token received from Google');
  }

  return { idToken };
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore errors on sign out
  }
}
