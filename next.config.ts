import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            'emoji-mart': path.resolve(__dirname, 'src/shims/emoji-mart.js'),
        };
        return config;
    },
};

export default nextConfig;
