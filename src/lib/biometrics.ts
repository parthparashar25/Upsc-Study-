/**
 * WebAuthn Biometric & Platform Authenticator Helper
 * Supports Fingerprint, Windows Hello, Touch ID, and Face Unlock
 */

const STORAGE_KEY = 'upsc_biometric_credentials';

export interface BiometricRecord {
  credentialId: string;
  userIdentifier: string; // username or email
  userSecretToken: string; // encoded token to resume session
  registeredAt: string;
}

export async function isBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(isAvailable);
  } catch {
    return false;
  }
}

export function getStoredBiometrics(): BiometricRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredBiometrics(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Registers the user's device fingerprint / Windows Hello authenticator
 */
export async function registerBiometricCredential(
  userIdentifier: string,
  userSecretToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supported = await isBiometricsSupported();
    if (!supported) {
      return { success: false, error: 'Biometric authenticator (Fingerprint/Windows Hello) is not available on this device.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(userIdentifier);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'UPSC Study Tracker',
        id: window.location.hostname === 'localhost' ? undefined : window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: userIdentifier,
        displayName: userIdentifier.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in device fingerprint / Windows Hello
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Biometric registration cancelled or failed.' };
    }

    const rawBytes = new Uint8Array(credential.rawId);
    let binary = "";
    for (let i = 0; i < rawBytes.length; i++) {
      binary += String.fromCharCode(rawBytes[i]);
    }
    const rawIdBase64 = btoa(binary);

    const record: BiometricRecord = {
      credentialId: rawIdBase64,
      userIdentifier,
      userSecretToken: btoa(userSecretToken),
      registeredAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return { success: true };
  } catch (err: any) {
    console.error('Biometric registration error:', err);
    return { success: false, error: err.message || 'Could not register biometric credentials.' };
  }
}

/**
 * Prompts user for Fingerprint / Windows Hello verification and returns stored authentication payload
 */
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  userIdentifier?: string;
  userSecretToken?: string;
  error?: string;
}> {
  try {
    const record = getStoredBiometrics();
    if (!record) {
      return { success: false, error: 'No fingerprint/biometric profile registered on this device yet.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rawIdBytes = Uint8Array.from(atob(record.credentialId), (c) => c.charCodeAt(0));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: rawIdBytes,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (!assertion) {
      return { success: false, error: 'Fingerprint verification failed or cancelled.' };
    }

    const decodedToken = atob(record.userSecretToken);
    return {
      success: true,
      userIdentifier: record.userIdentifier,
      userSecretToken: decodedToken,
    };
  } catch (err: any) {
    console.error('Biometric verification error:', err);
    return { success: false, error: err.message || 'Fingerprint verification failed.' };
  }
}
