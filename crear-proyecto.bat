@echo off
chcp 65001 >nul
echo ============================================
echo   NADIN REVENDEDORAS - Instalación Automática
echo ============================================
echo.

REM Crear estructura de carpetas
echo [1/4] Creando estructura de carpetas...
mkdir prisma 2>nul
mkdir public 2>nul
mkdir lib 2>nul
mkdir app 2>nul
mkdir app\api 2>nul
mkdir app\api\auth 2>nul
mkdir app\api\auth\login 2>nul
mkdir app\api\auth\registro 2>nul
mkdir app\api\catalogo 2>nul
mkdir app\api\pedidos 2>nul
mkdir app\api\consolidar 2>nul
mkdir app\api\analytics 2>nul
mkdir app\login 2>nul
mkdir app\registro 2>nul
mkdir app\dashboard 2>nul
mkdir app\dashboard\catalogo 2>nul
mkdir app\dashboard\pedidos 2>nul
mkdir app\dashboard\consolidar 2>nul
mkdir app\dashboard\perfil 2>nul
mkdir app\dashboard\analytics 2>nul
mkdir app\dashboard\historial 2>nul
mkdir components 2>nul

echo [2/4] Creando archivos de configuración...

REM package.json
(
echo {
echo   "name": "nadin-revendedoras-app",
echo   "version": "1.0.0",
echo   "private": true,
echo   "scripts": {
echo     "dev": "next dev",
echo     "build": "prisma generate && next build",
echo     "start": "next start",
echo     "lint": "next lint",
echo     "postinstall": "prisma generate"
echo   },
echo   "dependencies": {
echo     "@prisma/client": "^5.9.1",
echo     "bcryptjs": "^2.4.3",
echo     "next": "14.1.0",
echo     "next-auth": "^4.24.5",
echo     "nodemailer": "^6.9.9",
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "recharts": "^2.12.0",
echo     "lucide-react": "^0.320.0",
echo     "date-fns": "^3.3.1",
echo     "next-pwa": "^5.6.0"
echo   },
echo   "devDependencies": {
echo     "@types/bcryptjs": "^2.4.6",
echo     "@types/node": "^20.11.16",
echo     "@types/nodemailer": "^6.4.14",
echo     "@types/react": "^18.2.52",
echo     "@types/react-dom": "^18.2.18",
echo     "autoprefixer": "^10.4.17",
echo     "postcss": "^8.4.35",
echo     "prisma": "^5.9.1",
echo     "tailwindcss": "^3.4.1",
echo     "typescript": "^5.3.3"
echo   }
echo }
) > package.json

REM .gitignore
(
echo node_modules/
echo .next/
echo out/
echo build/
echo .env
echo .env*.local
echo .DS_Store
echo *.pem
echo .vercel
) > .gitignore

REM .env.example
(
echo DATABASE_URL="postgresql://usuario:password@host:5432/database"
echo.
echo TN_STORE_ID=6566743
echo TN_ACCESS_TOKEN=accb4de2caf771902f651fe3c2d2877c6a6609c6
echo TN_API_BASE=https://api.tiendanube.com/v1
echo TN_USER_AGENT=NadinRevendedorasApp ^(nadinlenceria@gmail.com^)
echo.
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=465
echo SMTP_SECURE=true
echo SMTP_USER=nadinlenceria@gmail.com
echo SMTP_PASS=tu_app_password_aqui
echo FROM_EMAIL=nadinlenceria@gmail.com
echo.
echo NEXTAUTH_SECRET=genera_un_string_random_aqui
echo NEXTAUTH_URL=http://localhost:3000
echo BASE_URL=http://localhost:3000
) > .env.example

REM tsconfig.json
(
echo {
echo   "compilerOptions": {
echo     "target": "ES2017",
echo     "lib": ["dom", "dom.iterable", "esnext"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "bundler",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [{"name": "next"}],
echo     "paths": {"@/*": ["./*"]}
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo }
) > tsconfig.json

REM next.config.js
(
echo const withPWA = require^('next-pwa'^)^({
echo   dest: 'public',
echo   register: true,
echo   skipWaiting: true,
echo   disable: process.env.NODE_ENV === 'development',
echo }^);
echo.
echo const nextConfig = {
echo   images: {
echo     remotePatterns: [
echo       { protocol: 'https', hostname: 'res.cloudinary.com' },
echo       { protocol: 'https', hostname: '**.tiendanube.com' },
echo     ],
echo   },
echo };
echo.
echo module.exports = withPWA^(nextConfig^);
) > next.config.js

REM tailwind.config.js
(
echo module.exports = {
echo   content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
echo   theme: {
echo     extend: {
echo       colors: { nadin: { pink: '#ef88b7', 'pink-dark': '#d97598' } },
echo       fontFamily: { sans: ['Open Sans', 'system-ui', 'sans-serif'] },
echo     },
echo   },
echo   plugins: [],
echo };
) > tailwind.config.js

REM postcss.config.js
(
echo module.exports = {
echo   plugins: { tailwindcss: {}, autoprefixer: {} },
echo };
) > postcss.config.js

echo [3/4] Creando archivos de la aplicación...

REM README.md
(
echo # Nadin Revendedoras App
echo.
echo ## Instalación
echo.
echo 1. Instalar dependencias:
echo ```bash
echo npm install
echo ```
echo.
echo 2. Configurar variables de entorno:
echo - Copiar .env.example a .env.local
echo - Completar las variables
echo.
echo 3. Configurar base de datos:
echo ```bash
echo npx prisma migrate dev
echo ```
echo.
echo 4. Iniciar desarrollo:
echo ```bash
echo npm run dev
echo ```
echo.
echo ## Deploy en Vercel
echo.
echo 1. Conectar repositorio de GitHub
echo 2. Configurar variables de entorno en Vercel
echo 3. Deploy automático
) > README.md

REM public/manifest.json
(
echo {
echo   "name": "Nadin Lencería - Revendedoras",
echo   "short_name": "Nadin",
echo   "start_url": "/",
echo   "display": "standalone",
echo   "background_color": "#ffffff",
echo   "theme_color": "#ef88b7",
echo   "icons": [
echo     {"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"},
echo     {"src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png"}
echo   ]
echo }
) > public\manifest.json

echo [4/4] Script de instalación completado!
echo.
echo ============================================
echo   PRÓXIMOS PASOS:
echo ============================================
echo 1. Ejecutar: npm install
echo 2. Configurar .env.local con tus credenciales
echo 3. Ejecutar: npx prisma migrate dev
echo 4. Ejecutar: npm run dev
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul