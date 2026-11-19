/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // helps with MediaPipe canvas and web speech API double initialization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/register',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/classroom/create',
        destination: '/teacher/classrooms/create',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
