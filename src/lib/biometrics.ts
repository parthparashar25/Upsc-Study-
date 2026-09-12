/**
 * WebAuthn Biometric & Platform Authenticator Helper
 * Supports Apple Touch ID, Face ID, Windows Hello, and Device Fingerprint
 */

const STORAGE_KEY = 'upsc_biometric_credentials';

export interface BiometricRecord {
  credentialId: string;
  userIdentifier: string; // username or email
  userSecretToken: string; // encoded token to resume session
  registeredAt: string;
}

export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Mac|iPhone|iPod|iPad/.test(navigator.userAgent) ||
    /Mac|iPhone|iPod|iPad/.test(navigator.platform)
  );
}

export function getBiometricPlatformName(): string {
  if (isAppleDevice()) {
    return 'Apple Touch ID / Face ID';
  }
  if (typeof navigator !== 'undefined' && /Win/.test(navigator.userAgent)) {
    return 'Windows Hello / Fingerprint';
  }
  return 'Fingerprint / Biometrics';
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
 * Registers the user's device Apple Touch ID / Windows Hello / Fingerprint authenticator
 */
export async function registerBiometricCredential(
  userIdentifier: string,
  userSecretToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supported = await isBiometricsSupported();
    if (!supported) {
      const name = getBiometricPlatformName();
      return {
        success: false,
        error: `${name} is not available or not configured on this device.`,
      };
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
        { alg: -7, type: 'public-key' }, // ES256 (Apple Touch ID & standard)
        { alg: -257, type: 'public-key' }, // RS256 (Windows Hello)
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in platform authenticator: Apple Touch ID / Face ID / Windows Hello
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
      return { success: false, error: `${getBiometricPlatformName()} registration cancelled or failed.` };
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
    return { success: false, error: err.message || `Could not register ${getBiometricPlatformName()}.` };
  }
}

/**
 * Prompts user for Apple Touch ID / Windows Hello / Fingerprint verification and returns stored credentials
 */
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  userIdentifier?: string;
  userSecretToken?: string;
  error?: string;
}> {
  try {
    const record = getStoredBiometrics();
    const platformName = getBiometricPlatformName();

    if (!record) {
      return {
        success: false,
        error: `No ${platformName} profile registered on this device yet.`,
      };
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
      return { success: false, error: `${platformName} verification was cancelled.` };
    }

    const decodedToken = atob(record.userSecretToken);
    return {
      success: true,
      userIdentifier: record.userIdentifier,
      userSecretToken: decodedToken,
    };
  } catch (err: any) {
    console.error('Biometric verification error:', err);
    return { success: false, error: err.message || `${getBiometricPlatformName()} verification failed.` };
  }
}
