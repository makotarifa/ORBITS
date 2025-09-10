# Prompt para Claude Code: Juego de Naves Espaciales Multijugador

Crea un proyecto completo de juego de naves espaciales multijugador que funcione en navegador y se pueda exportar a escritorio. 

## Stack Tecnológico Requerido:

### Frontend (Cliente)
- **React 18** con hooks (useState, useEffect, useRef)
- **Phaser.js 3** como motor de juego (canvas)
- **Socket.io-client** para comunicación en tiempo real
- **Axios** para llamadas API REST
- **Tailwind CSS** para estilos (utility-first approach)
- **Vite** como bundler

### Backend (Servidor)
- **Node.js** con **NestJS** (framework modular y escalable)
- **Socket.io** para multijugador en tiempo real (integrado con NestJS WebSocket Gateway)
- **PostgreSQL** con **TypeORM** para base de datos
- **JWT** para autenticación con **Passport.js**
- **bcrypt** para hash de contraseñas
- **CORS** configurado
- **class-validator** y **class-transformer** para validación
- **@nestjs/swagger** para documentación automática de API

### Exportación a Escritorio
- **Electron** configurado para empaquetar la app React

## Estructura de Proyecto Requerida:

```
space-game/
├── client/                 # App React + Phaser
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── game/          # Lógica Phaser
│   │   ├── services/      # API calls y Socket.io
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/
├── server/                # Backend Node.js
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rutas API REST
│   ├── middleware/        # Auth, validation, etc.
│   ├── socket/            # Lógica Socket.io
│   └── utils/
├── shared/                # Código compartido
│   ├── constants/
│   ├── types/
│   └── validators/
├── electron/              # Configuración Electron
└── docs/
```

## Funcionalidades a Implementar:

### Sistema Base
1. **Arquitectura:** Separar completamente React (UI) de Phaser (juego)
2. **Estados de la App:** Menu principal, Login, Juego, Pausa, Game Over
3. **Comunicación:** Sistema de eventos entre React y Phaser

### Multijugador en Tiempo Real (Socket.io)
- Salas de juego (rooms)
- Sincronización de posición de naves
- Disparos y colisiones en tiempo real
- Chat durante partidas
- Sistema de matchmaking básico

### API REST
- Registro/Login de usuarios con JWT
- Perfil de jugador (estadísticas)
- Rankings globales
- Historial de partidas
- Configuración de usuario

### Juego (Phaser)
- Nave espacial con controles suaves (WASD o flechas)
- Sistema de disparos
- Física básica (colisiones)
- Efectos visuales (explosiones, estrellas de fondo)
- Audio básico
- Límites del mapa

### UI React
- Menu principal responsive
- HUD durante el juego (vida, puntuación, minimapa)
- Sistema de login/registro
- Tabla de rankings
- Configuración de controles

## Configuración Específica:

### Electron
- Configurar para desarrollo y producción
- Auto-updater básico
- Menús nativos
- Ventana redimensionable

### Base de Datos (PostgreSQL)
- Entidad Usuario (username, email, password hash, stats) con TypeORM
- Entidad Partida (players, duration, winner, timestamp) con relaciones
- Entidad Ranking (user, score, rank) con índices optimizados
- Migraciones para manejo de esquema y versionado

### Socket.io Events
```
// Cliente → Servidor
'joinRoom', 'leaveRoom', 'playerMove', 'playerShoot', 'chatMessage'

// Servidor → Cliente  
'roomJoined', 'playerJoined', 'playerLeft', 'gameUpdate', 'playerHit', 'gameOver'
```

## Instrucciones Adicionales:

1. **Usa TypeScript** si es posible para mejor tipado
2. **Implementa validación** tanto en frontend como backend
3. **Configura ESLint y Prettier**
4. **Incluye scripts** en package.json para desarrollo y build
5. **Documenta las API** con comentarios claros
6. **Manejo de errores** robusto en todas las capas
7. **Variables de entorno** para configuración (.env files)

## Archivos de Configuración Necesarios:

- `package.json` para cada parte (client, server, electron)
- `vite.config.js` para el cliente React
- `nest-cli.json` y `tsconfig.json` para NestJS
- `tailwind.config.js` para configuración de Tailwind CSS
- `electron-builder` configuración
- `.env.example` files para cada ambiente
- `docker-compose.yml` con PostgreSQL para desarrollo
- `README.md` con instrucciones completas de setup

## Resultado Esperado:

Un MMORPG espacial funcional donde los jugadores pueden:
- **Crear y personalizar** múltiples naves con diferentes configuraciones
- **Explorar mapas persistentes** con otros jugadores en tiempo real
- **Combatir estratégicamente** usando habilidades con cooldowns y targeteo
- **Progresar** subiendo de nivel, desbloqueando skills y mejor equipamiento
- **Formar corporaciones** para PvP organizado y contenido grupal
- **Farmear recursos** matando NPCs y minando asteroides
- **Competir** en rankings globales y eventos especiales
- **Comerciar** items y recursos con otros jugadores

La experiencia debe ser **fluida entre navegador y escritorio**, con el mismo save y progresión.

Implementa primero el **sistema base de combate con habilidades**, luego **mapas persistentes con NPCs**, y finalmente **sistemas sociales y economía**. Prioriza que el loop de juego core (mover → targetear → usar habilidades → matar NPCs → subir nivel) funcione perfectamente antes que features avanzadas.