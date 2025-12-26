import keytar from 'keytar';

const SERVICE_NAME = 'moth-cli';
const LEGACY_SERVICE_NAME = 'saute-cli';

export async function setApiKey(profileName: string, key: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, profileName, key);
}

export async function getApiKey(profileName: string): Promise<string | null> {
  let key = await keytar.getPassword(SERVICE_NAME, profileName);
  if (!key) {
      // Try legacy service and migrate if found
      key = await keytar.getPassword(LEGACY_SERVICE_NAME, profileName);
      if (key) {
          await keytar.setPassword(SERVICE_NAME, profileName, key);
      }
  }
  return key;
}

export async function deleteApiKey(profileName: string): Promise<boolean> {
  return keytar.deletePassword(SERVICE_NAME, profileName);
}
