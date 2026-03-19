/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    // Asset prefix relativo força o Next.js a gerar caminhos portáveis sem / inicial
    assetPrefix: '',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://pnmlyfsqpujxuvvwyxwa.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        NEXT_PUBLIC_API_URL: "https://3c71215371174476a6.v2.appdeploy.ai"
    }
};

module.exports = nextConfig;
