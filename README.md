# Orbits - Juego Espacial Multijugador

Un juego espacial multijugador desarrollado con React + Phaser.js en el frontend y NestJS + PostgreSQL en el backend, con soporte para exportación a desktop mediante Electron.

## 🚀 Tecnologías

### Frontend (Cliente)
- **React 18** con TypeScript
- **Phaser.js 3** como motor de juego
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Socket.io-client** para comunicación en tiempo real
- **Zustand** para manejo de estado global
- **React Query** para estado del servidor

### Backend (Servidor)
- **NestJS** con TypeScript
- **PostgreSQL** con TypeORM
- **Socket.io** para multijugador en tiempo real
- **JWT + Passport.js** para autenticación
- **class-validator** para validación
- **Swagger** para documentación de API

### Desktop (Electron)
- **Electron** para empaquetado multiplataforma
- **Auto-updater** para actualizaciones automáticas
- Soporte para Windows, macOS y Linux

## 📁 Estructura del Proyecto

```
orbits/
├── client/                 # Aplicación React + Phaser
│   ├── src/
│   │   ├── components/     # Componentes React UI
│   │   ├── game/          # Lógica del juego Phaser
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API y Socket.io
│   │   ├── stores/        # Estados globales Zustand
│   │   ├── types/         # Definiciones TypeScript
│   │   └── assets/        # Assets del juego
│   └── package.json
├── server/                # Backend NestJS
│   ├── src/
│   │   ├── modules/       # Módulos de funcionalidad
│   │   ├── entities/      # Entidades TypeORM
│   │   ├── migrations/    # Migraciones de base de datos
│   │   └── common/        # Utilidades compartidas
│   └── package.json
├── electron/              # Aplicación desktop
│   ├── src/
│   │   ├── main/         # Proceso principal
│   │   └── preload/      # Scripts de precarga
│   └── package.json
├── shared/                # Código compartido
│   ├── constants/
│   ├── types/
│   └── validators/
└── docs/                  # Documentación
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- Git

### Configuración Inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd orbits
   ```

2. **Configurar variables de entorno**
   ```bash
   # Servidor
   cp server/.env.example server/.env
   
   # Cliente
   cp client/.env.example client/.env
   ```

3. **Instalar dependencias**
   ```bash
   # Cliente
   cd client && npm install
   
   # Servidor
   cd ../server && npm install
   
   # Electron
   cd ../electron && npm install
   ```

4. **Configurar base de datos**
   ```bash
   # Crear base de datos PostgreSQL
   createdb orbits_game
   
   # Ejecutar migraciones
   cd server && npm run migration:run
   ```

## 🚀 Desarrollo

### Ejecutar en modo desarrollo

1. **Iniciar el servidor backend**
   ```bash
   cd server
   npm run start:dev
   ```

2. **Iniciar el cliente frontend**
   ```bash
   cd client
   npm run dev
   ```

3. **Ejecutar aplicación Electron (opcional)**
   ```bash
   cd electron
   npm run dev
   ```

### Scripts disponibles

#### Cliente
- `npm run dev` - Servidor de desarrollo con hot reload
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter de código
- `npm run test` - Ejecutar tests

#### Servidor
- `npm run start:dev` - Modo desarrollo con hot reload
- `npm run start:prod` - Modo producción
- `npm run build` - Compilar TypeScript
- `npm run test` - Tests unitarios
- `npm run test:e2e` - Tests end-to-end
- `npm run migration:generate` - Generar migración
- `npm run migration:run` - Ejecutar migraciones

#### Electron
- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Build para todas las plataformas
- `npm run build:win` - Build para Windows
- `npm run build:mac` - Build para macOS
- `npm run build:linux` - Build para Linux

## 🎮 Funcionalidades

### Core del Juego
- ✅ Naves espaciales con controles suaves
- ✅ Sistema de disparos y colisiones
- ✅ Física básica y efectos visuales
- ✅ Audio ambiente y efectos

### Multijugador
- ✅ Salas de juego en tiempo real
- ✅ Sincronización de movimientos y disparos
- ✅ Sistema de chat durante partidas
- ✅ Matchmaking básico

### Sistema de Usuario
- ✅ Registro y autenticación JWT
- ✅ Perfiles de jugador con estadísticas
- ✅ Rankings globales
- ✅ Historial de partidas

### Desktop
- ✅ Empaquetado para Windows, macOS, Linux
- ✅ Auto-updater automático
- ✅ Integración nativa del sistema

## 🔧 Configuración Avanzada

### Variables de Entorno

#### Servidor (.env)
```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=orbits_game

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:5173

# Servidor
PORT=3000
NODE_ENV=development
```

#### Cliente (.env)
```env
# API
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000

# Juego
VITE_GAME_DEBUG=true
VITE_GAME_PHYSICS_DEBUG=false
```

## 📚 Documentación Adicional

- [Guía de Desarrollo](docs/development-guide.md)
- [Arquitectura del Sistema](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Game Design Document](docs/game-design.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para reportar bugs o solicitar features, por favor usar [GitHub Issues](https://github.com/your-username/orbits/issues).