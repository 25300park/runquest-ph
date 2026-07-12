const productionUrl = process.env.PRODUCTION_URL;
const adminSecret = process.env.ADMIN_SECRET;

async function main() {
  if (!productionUrl || !adminSecret) {
    throw new Error('PRODUCTION_URL and ADMIN_SECRET are required to generate executive reports.');
  }

  const response = await fetch(`${productionUrl}/api/executive/generate-kpi-report`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSecret}`
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Executive report generation failed.');
  }

  console.log('Executive report generated:', data);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
