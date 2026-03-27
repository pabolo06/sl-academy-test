const { chromium } = require('playwright');

const RAILWAY_URL = 'https://railway.com/project/1171f340-59dc-4fdb-9692-071834c5f894?environmentId=c860fdf2-7a5a-4e5a-82a2-2c9e8678b366';
const BACKEND_URL = 'https://web-production-e40b7.up.railway.app';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;

async function monitorRailway() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🚀 Iniciando monitoramento do Railway...\n');

  try {
    console.log('📍 Acessando painel Railway...');
    await page.goto(RAILWAY_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Procurar pelo status do deployment
    const deploymentStatus = await page.evaluate(() => {
      // Procura por elementos com status
      const elements = document.querySelectorAll('*');
      let status = '';
      for (let el of elements) {
        const text = el.innerText || '';
        if (text.includes('ACTIVE') || text.includes('DEPLOYING') || text.includes('FAILED')) {
          status = text.substring(0, 100);
          break;
        }
      }
      return status || 'Status não encontrado';
    });

    console.log(`📊 Status encontrado: ${deploymentStatus}\n`);

    console.log('⏳ Aguardando 15 segundos antes de testar...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('⚠️  Aviso ao acessar Railway:', error.message);
  }

  await browser.close();

  // Testar API
  console.log('\n🧪 Testando backend API...');
  console.log(`🔗 URL: ${HEALTH_ENDPOINT}\n`);

  try {
    const response = await fetch(HEALTH_ENDPOINT, { timeout: 10000 });
    const data = await response.json();

    if (response.ok) {
      console.log('✅ ✅ ✅ BACKEND ESTÁ FUNCIONANDO! ✅ ✅ ✅');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`⚠️  Status HTTP ${response.status}`);
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao testar backend: ${error.message}`);
    return false;
  }
}

// Executar
monitorRailway().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
