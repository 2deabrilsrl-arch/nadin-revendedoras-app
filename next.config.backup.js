/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Usar el service worker mejorado
  sw: 'sw-enhanced.js',
  runtimeCaching: [
    // Fuentes de Google
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
        },
      },
    },
    // Fuentes locales
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // Imágenes estáticas
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // Imágenes de Next.js optimizadas
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // Imágenes de Tiendanube/CDN
    {
      urlPattern: /^https:\/\/[^\/]*(?:mitiendanube|cloudfront)\.com\/.+\.(?:jpg|jpeg|png|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'product-images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
        },
      },
    },
    // JavaScript
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
        },
      },
    },
    // CSS
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
        },
      },
    },
    // Next.js data files
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 día
        },
        networkTimeoutSeconds: 5,
      },
    },
    // API calls (GET only)
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Otros recursos
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 día
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // Minificación con SWC (más rápido que Terser)
  swcMinify: true,

  // Comprimir respuestas HTTP
  compress: true,

  // Optimización de imágenes
  images: {
    domains: [
      'acdn.mitiendanube.com',
      'acdn-us.mitiendanube.com',
      'cdn.mitiendanube.com',
      'd3ugyf2ht6aenh.cloudfront.net',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compilador optimizations
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features para mejor performance
  experimental: {
    // Optimizar CSS
    optimizeCss: true,
    
    // Optimizar imports de paquetes grandes
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
    
    // Lazy compilation (más rápido en dev)
    webpackBuildWorker: true,
  },

  // Headers para cache y seguridad
  async headers() {
    return [
      // Cache de assets estáticos
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Preload de recursos críticos
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</icons/icon-192x192.png>; rel=preload; as=image',
          },
        ],
      },
      // Security headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Configuración de Webpack para optimizaciones adicionales
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones solo para producción
    if (!dev) {
      // Tree shaking mejorado
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };

      // Minimizar bundle size
      config.performance = {
        maxAssetSize: 512000,
        maxEntrypointSize: 512000,
        hints: 'warning',
      };
    }

    return config;
  },

  // Configuración de output
  output: 'standalone',

  // Power: off (reducir uso de CPU en desarrollo)
  poweredByHeader: false,

  // Generar source maps solo en desarrollo
  productionBrowserSourceMaps: false,
};

module.exports = withPWA(nextConfig);
