/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/support-chat', // Set the base path
    trailingSlash: true,
    async redirects() {
        return [
            {
                source: '/',
                destination: '/support-chat',
                basePath: false,
                permanent: false
            }
        ]
    }
  };
  
export default nextConfig;
