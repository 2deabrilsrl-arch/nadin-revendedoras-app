# Nadin Revendedoras App

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
- Copiar .env.example a .env.local
- Completar las variables

3. Configurar base de datos:
```bash
npx prisma migrate dev
```

4. Iniciar desarrollo:
```bash
npm run dev
```

## Deploy en Vercel

1. Conectar repositorio de GitHub
2. Configurar variables de entorno en Vercel
3. Deploy automático
