const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const https = require('https');

async function loadAwsSecrets() {
  const secretId = process.env.AWS_SECRETS_ID || process.env.AWS_SECRETS_ARN;
  if (!secretId) {
    return;
  }

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) {
    console.warn('⚠️ AWS_REGION não configurado. Ignorando Secrets Manager.');
    return;
  }

  const client = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);

  if (!response || !response.SecretString) {
    return;
  }

  let secretPayload = {};
  try {
    secretPayload = JSON.parse(response.SecretString);
  } catch (error) {
    console.warn('⚠️ SecretString não é JSON válido. Ignorando Secrets Manager.');
    return;
  }

  const shouldOverride = process.env.SECRETS_OVERRIDE === 'true';
  Object.entries(secretPayload).forEach(([key, value]) => {
    if (shouldOverride || process.env[key] === undefined) {
      process.env[key] = String(value);
    }
  });
}

function httpGetJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on('error', reject);
  });
}

async function loadVaultSecrets() {
  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN;
  const vaultPath = process.env.VAULT_SECRET_PATH;

  if (!vaultAddr || !vaultToken || !vaultPath) {
    return;
  }

  const url = `${vaultAddr.replace(/\/+$/, '')}/v1/${vaultPath.replace(/^\/+/, '')}`;
  const response = await httpGetJson(url, { 'X-Vault-Token': vaultToken });

  const payload = response?.data?.data || response?.data || {};
  const shouldOverride = process.env.SECRETS_OVERRIDE === 'true';
  Object.entries(payload).forEach(([key, value]) => {
    if (shouldOverride || process.env[key] === undefined) {
      process.env[key] = String(value);
    }
  });
}

async function loadAzureKeyVaultSecrets() {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  const namesRaw = process.env.AZURE_KEYVAULT_SECRET_NAMES;

  if (!vaultUrl || !namesRaw) {
    return;
  }

  const secretNames = namesRaw.split(',').map((name) => name.trim()).filter(Boolean);
  if (secretNames.length === 0) {
    return;
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);
  const shouldOverride = process.env.SECRETS_OVERRIDE === 'true';

  for (const name of secretNames) {
    const secret = await client.getSecret(name);
    if (secret?.name) {
      if (shouldOverride || process.env[secret.name] === undefined) {
        process.env[secret.name] = String(secret.value || '');
      }
    }
  }
}

async function loadSecrets() {
  await loadAwsSecrets();
  await loadVaultSecrets();
  await loadAzureKeyVaultSecrets();
}

module.exports = { loadSecrets };
