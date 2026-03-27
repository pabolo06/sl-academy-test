const BACKEND_URL = 'https://web-production-e40b7.up.railway.app/health';
const MAX_ATTEMPTS = 30;
const INTERVAL = 5000; // 5 segundos

async function testBackend(attempt = 1) {
  console.log(`\n🔄 Tentativa ${attempt}/${MAX_ATTEMPTS} (${new Date().toLocaleTimeString()})`);

  try {
    const response = await fetch(BACKEND_URL, {
      timeout: 10000,
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ ✅ ✅ SUCESSO! BACKEND ESTÁ FUNCIONANDO! ✅ ✅ ✅');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      process.exit(0);
    } else {
      console.log(`⚠️  Status: ${response.status} ${response.statusText}`);
      console.log(`Message: ${data.message}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  if (attempt < MAX_ATTEMPTS) {
    console.log(`⏳ Aguardando ${INTERVAL / 1000} segundos antes da próxima tentativa...`);
    setTimeout(() => testBackend(attempt + 1), INTERVAL);
  } else {
    console.log('\n❌ Máximo de tentativas atingido. Backend não está respondendo.');
    process.exit(1);
  }
}

console.log('🚀 Monitorando backend do Railway...');
console.log(`🔗 URL: ${BACKEND_URL}`);
console.log(`⏱️  Tentando por até ${(MAX_ATTEMPTS * INTERVAL) / 1000 / 60} minutos...\n`);

testBackend();
