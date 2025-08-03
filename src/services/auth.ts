import * as Keychain from 'react-native-keychain';

export async function storeCredentials({ url, token }: { url: string; token: string }) {
  await Keychain.setGenericPassword(url, token);
}

export async function getStoredCredentials() {
  const creds = await Keychain.getGenericPassword();
  if (creds) return { url: creds.username, token: creds.password };
  return null;
}

export async function validateFireflyToken({ url, token }: { url: string; token: string }) {
  try {
    const res = await fetch(`${url}/api/v1/ping`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}