/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}
const withTM = require('next-transpile-modules')(['archive-client-ts'])

module.exports = withTM(nextConfig)
