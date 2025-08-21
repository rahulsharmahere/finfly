import EncryptedStorage from 'react-native-encrypted-storage';

export const saveCredentials = async (host, token) => {
  try {
    await EncryptedStorage.setItem(
      'firefly_credentials',
      JSON.stringify({ host, token })
    );
  } catch (error) {
    console.error('Failed to save credentials:', error);
  }
};

export const getCredentials = async () => {
  try {
    const data = await EncryptedStorage.getItem('firefly_credentials');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve credentials:', error);
    return null;
  }
};

export const getCredentialItem = async (key) => {
  try {
    const data = await EncryptedStorage.getItem('firefly_credentials');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed[key] || null;
  } catch (error) {
    console.error(`Failed to retrieve ${key}:`, error);
    return null;
  }
};

export const clearCredentials = async () => {
  try {
    await EncryptedStorage.removeItem('firefly_credentials');
  } catch (error) {
    console.error('Failed to clear credentials:', error);
  }
};
