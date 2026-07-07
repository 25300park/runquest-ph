const productionUrl = process.env.PRODUCTION_URL;
const adminSecret = process.env.ADMIN_SECRET;

async function main() {
  if (!productionUrl || !adminSecret) {
    throw new Error('PRODUCTION_URL and ADMIN_SECRET are required to expire Premium Passes.');
  }

  const response = await fetch(`${productionUrl}/api/payment/expire-passes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSecret}`
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Premium Pass expiration job failed.');
  }

  console.log('Premium Pass expiration job complete:', data);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
