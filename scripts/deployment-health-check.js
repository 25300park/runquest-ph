import { npmCommand, readEnvValue, runChecked } from './pipeline-utils.js';

function getBaseUrl() {
  const configuredUrl =
    readEnvValue('PRODUCTION_URL') ||
    readEnvValue('VERCEL_PROJECT_PRODUCTION_URL') ||
    readEnvValue('VERCEL_URL');

  if (!configuredUrl) {
    throw new Error('Missing PRODUCTION_URL or VERCEL_URL for deployment health check.');
  }

  return configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readNumberEnv(name, fallback) {
  const value = Number(readEnvValue(name));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function assertOk(url, label) {
  const response = await fetch(url, {
    headers: {
      'x-admin-secret': readEnvValue('ADMIN_SECRET')
    }
  });

  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function main() {
  console.log('RunQuest PH deployment health check');
  const baseUrl = getBaseUrl();
  const retries = readNumberEnv('HEALTH_CHECK_RETRIES', 3);
  const delaySeconds = readNumberEnv('HEALTH_CHECK_DELAY_SECONDS', 20);
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 1) {
        console.log(`Retrying health check (${attempt}/${retries})...`);
      }

      const healthResponse = await assertOk(`${baseUrl}/api/health`, 'Health endpoint');
      const health = await healthResponse.json();

      if (health.status !== 'ok' && health.ok !== true) {
        throw new Error('Health endpoint returned failed status.');
      }

      if (health.supabase !== true) {
        throw new Error(`Supabase health failed: ${health.checks?.supabase?.message ?? 'unknown error'}`);
      }

      if (health.admin !== true) {
        throw new Error(`Admin route health failed: ${health.checks?.admin?.message ?? 'unknown error'}`);
      }

      await assertOk(`${baseUrl}/admin`, 'Admin route');

      console.log('Deployment health check passed.');
      return;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await delay(delaySeconds * 1000);
      }
    }
  }

  throw lastError ?? new Error('Deployment health check failed.');
}

main().catch((error) => {
  console.error('Deployment health check failed.');
  console.error(error.message);

  if (readEnvValue('AUTO_ROLLBACK') === 'true') {
    console.log('AUTO_ROLLBACK=true. Starting rollback workflow.');
    runChecked(npmCommand(), ['run', 'auto:rollback'], { stdio: 'inherit' });
  }

  process.exitCode = 1;
});
