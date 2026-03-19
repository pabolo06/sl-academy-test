/** @type {import('next').NextConfig} */
const nextConfig = {
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
        NEXT_PUBLIC_API_URL: "https://pabolo09-sl-academy-api.hf.space"
    }
};

module.exports = nextConfig;
