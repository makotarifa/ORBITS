# User Stories - Orbits Space Game

## 📋 Epic 1: [AUTH-UI] Sistema de Autenticación

### 🔐 US-001: Registro de Usuario
**Como** nuevo jugador  
**Quiero** registrarme con email y contraseña  
**Para** poder acceder al juego y guardar mi progreso  

**Criterios de Aceptación:**
- [ ] Pantalla de registro con campos: email, username, password, confirm password
- [ ] Validación de email formato válido
- [ ] Password mínimo 8 caracteres
- [ ] Username único en el sistema
- [ ] Mensaje de confirmación al registrarse exitosamente
- [ ] Redirección automática al login tras registro

**Story Points:** 5  
**Prioridad:** Critical  
**Quick Win:** ⚡ (2-3 días)

---

### 🔑 US-002: Inicio de Sesión
**Como** jugador registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** acceder a mis partidas y estadísticas  

**Criterios de Aceptación:**
- [ ] Pantalla de login con email/username y password
- [ ] Validación de credenciales en backend
- [ ] Generación de JWT token al autenticarse
- [ ] Almacenamiento seguro del token
- [ ] Redirección al lobby tras login exitoso
- [ ] Mensaje de error para credenciales incorrectas

**Story Points:** 3  
**Prioridad:** Critical  
**Quick Win:** ⚡ (1-2 días)

---

### 👤 US-003: Perfil de Usuario Básico
**Como** jugador autenticado  
**Quiero** ver mi perfil con estadísticas básicas  
**Para** conocer mi progreso y rendimiento  

**Criterios de Aceptación:**
- [ ] Pantalla de perfil accesible desde menú principal
- [ ] Mostrar username, email, fecha de registro
- [ ] Estadísticas: partidas jugadas, victorias, derrotas
- [ ] Ratio de kills/deaths
- [ ] Tiempo total de juego
- [ ] Opción para cerrar sesión

**Story Points:** 3  
**Prioridad:** Medium

---

## 📋 Epic 2: [PHASER] Motor de Juego Básico

### 🚀 US-004: Nave Espacial Controlable
**Como** jugador  
**Quiero** controlar una nave espacial en pantalla  
**Para** navegar por el espacio del juego  

**Criterios de Aceptación:**
- [ ] Sprite de nave espacial visible en pantalla
- [ ] Movimiento con teclas WASD o flechas direccionales
- [ ] Rotación de nave hacia dirección de movimiento
- [ ] Animación suave de movimiento (momentum)
- [ ] Límites de pantalla (nave no puede salir del área)
- [ ] Velocidad de movimiento balanceada

**Story Points:** 5  
**Prioridad:** Critical  
**Quick Win:** ⚡ (1-2 días)

---

### 🎨 US-005: Entorno Espacial Básico
**Como** jugador  
**Quiero** ver un entorno espacial inmersivo  
**Para** sentirme en una batalla espacial  

**Criterios de Aceptación:**
- [ ] Fondo espacial con estrellas
- [ ] Efecto parallax para sensación de profundidad
- [ ] Colores y tema espacial consistente
- [ ] Área de juego claramente definida
- [ ] Rendimiento estable (60 FPS)
- [ ] Resolución responsive

**Story Points:** 3  
**Prioridad:** High  
**Quick Win:** ⚡ (1 día)

---

### ⚔️ US-006: Sistema de Combate Básico
**Como** jugador  
**Quiero** disparar proyectiles y causar daño  
**Para** combatir contra otros jugadores  

**Criterios de Aceptación:**
- [ ] Disparo con clic del mouse o barra espaciadora
- [ ] Proyectiles visibles que se mueven hacia el objetivo
- [ ] Colisión de proyectiles con otras naves
- [ ] Sistema de vida (HP) para cada nave
- [ ] Indicador visual de vida actual
- [ ] Destrucción de nave cuando HP llega a 0
- [ ] Efecto de explosión al destruirse

**Story Points:** 8  
**Prioridad:** High  
**Quick Win:** ⚡ (3-4 días)

---

## 📋 Epic 3: [MULTIPLAYER] Multijugador en Tiempo Real

### 🌐 US-007: Conexión WebSocket
**Como** jugador  
**Quiero** conectarme con otros jugadores en tiempo real  
**Para** jugar partidas multijugador  

**Criterios de Aceptación:**
- [ ] Conexión WebSocket establecida al entrar al juego
- [ ] Reconexión automática en caso de desconexión
- [ ] Indicador de estado de conexión (conectado/desconectado)
- [ ] Autenticación del socket con JWT token
- [ ] Manejo de errores de conexión
- [ ] Latencia mostrada en pantalla

**Story Points:** 8  
**Prioridad:** Critical

---

### 👥 US-008: Sincronización de Jugadores
**Como** jugador  
**Quiero** ver a otros jugadores moverse en tiempo real  
**Para** interactuar y competir con ellos  

**Criterios de Aceptación:**
- [ ] Múltiples naves visibles en pantalla
- [ ] Movimiento de otros jugadores actualizado en tiempo real
- [ ] Identificación única de cada jugador (username)
- [ ] Diferentes colores/sprites para distinguir jugadores
- [ ] Predicción de movimiento para suavizar latencia
- [ ] Actualización a 60 FPS mínimo

**Story Points:** 13  
**Prioridad:** Critical  
**Quick Win:** ⚡ (3-4 días)

---

### 🎯 US-009: Salas de Juego
**Como** jugador  
**Quiero** unirme a partidas con otros jugadores  
**Para** encontrar oponentes rápidamente  

**Criterios de Aceptación:**
- [ ] Sistema de matchmaking automático
- [ ] Salas de 2-8 jugadores
- [ ] Indicador de jugadores en sala actual
- [ ] Tiempo de espera máximo para matchmaking
- [ ] Balanceo básico de skill (opcional para MVP)
- [ ] Reconexión a sala si se desconecta

**Story Points:** 8  
**Prioridad:** High

---

## 📋 Epic 4: [PVE-SYSTEM] Sistema PvE Básico

### 🤖 US-014: NPCs Enemigos Básicos
**Como** jugador  
**Quiero** enfrentarme a enemigos controlados por IA  
**Para** practicar y disfrutar contenido individual  

**Criterios de Aceptación:**
- [ ] NPCs enemigos aparecen automáticamente en el mapa
- [ ] NPCs tienen sprite diferente a jugadores (color rojo)
- [ ] NPCs se mueven con patrones básicos (patrullaje)
- [ ] NPCs pueden disparar proyectiles a jugadores cercanos
- [ ] NPCs tienen HP y pueden ser destruidos
- [ ] NPCs otorgan puntos al ser eliminados
- [ ] Respawn automático de NPCs tras ser destruidos

**Story Points:** 8  
**Prioridad:** High  
**Quick Win:** ⚡ (3-4 días)

---

### 🌊 US-015: Sistema de Oleadas
**Como** jugador  
**Quiero** enfrentar oleadas de enemigos progresivamente más difíciles  
**Para** tener un desafío creciente y objetivos claros  

**Criterios de Aceptación:**
- [ ] Oleadas aparecen cada 2-3 minutos
- [ ] Cada oleada tiene más NPCs que la anterior
- [ ] Indicador en HUD de oleada actual
- [ ] Bonus de puntos por completar oleada
- [ ] Pausa entre oleadas para reagruparse
- [ ] Dificultad escala gradualmente

**Story Points:** 5  
**Prioridad:** Medium

---

### 🎯 US-016: IA de NPCs Mejorada
**Como** jugador  
**Quiero** que los NPCs tengan comportamientos variados  
**Para** mantener el combate interesante y desafiante  

**Criterios de Aceptación:**
- [ ] NPCs persiguen al jugador más cercano
- [ ] NPCs evitan colisiones entre ellos
- [ ] Diferentes tipos de NPCs (rápidos, tanques, francotiradores)
- [ ] NPCs reaccionan al daño recibido
- [ ] Comportamiento de grupo en oleadas
- [ ] Predicción básica de movimiento del jugador

**Story Points:** 13  
**Prioridad:** Medium

---

## 📋 Epic 5: [GAME-LOGIC] Sistema de Puntuación

### 🏆 US-010: Puntuación en Partida
**Como** jugador  
**Quiero** ver mi puntuación durante la partida  
**Para** saber cómo estoy rindiendo  

**Criterios de Aceptación:**
- [ ] HUD que muestre puntuación actual
- [ ] Puntos por destruir naves enemigas
- [ ] Bonus por tiempo de supervivencia
- [ ] Leaderboard en tiempo real durante partida
- [ ] Puntuación final al terminar partida
- [ ] Comparación con otros jugadores

**Story Points:** 5  
**Prioridad:** Medium

---

### 📊 US-011: Estadísticas Post-Partida
**Como** jugador  
**Quiero** ver mis estadísticas al finalizar la partida  
**Para** analizar mi rendimiento  

**Criterios de Aceptación:**
- [ ] Pantalla de resultados al finalizar partida
- [ ] Kills, deaths, tiempo de supervivencia
- [ ] Comparación con otros jugadores de la partida
- [ ] Guardado de estadísticas en perfil
- [ ] Opción para nueva partida o volver al menú
- [ ] Tiempo en pantalla de resultados antes de continuar

**Story Points:** 5  
**Prioridad:** Medium

---

## 📋 Epic 5: [GAME-UI] Interfaz de Usuario

### 🎮 US-012: HUD de Juego
**Como** jugador  
**Quiero** ver información importante durante el juego  
**Para** tomar decisiones estratégicas  

**Criterios de Aceptación:**
- [ ] Indicador de vida (HP) prominente
- [ ] Puntuación actual visible
- [ ] Lista de jugadores conectados
- [ ] Indicador de latencia/conexión
- [ ] Minimapa básico (opcional para MVP)
- [ ] UI no intrusiva que no bloquee el gameplay

**Story Points:** 8  
**Prioridad:** High

---

### 🏠 US-013: Menú Principal
**Como** jugador  
**Quiero** navegar fácilmente entre opciones del juego  
**Para** acceder a todas las funcionalidades  

**Criterios de Aceptación:**
- [ ] Menú principal con opciones claras
- [ ] Botón "Jugar" para matchmaking rápido
- [ ] Acceso a perfil de usuario
- [ ] Configuraciones básicas
- [ ] Opción para salir del juego
- [ ] Diseño consistente con tema espacial

**Story Points:** 5  
**Prioridad:** Medium

---

## 🚀 Priorización Final

### **Crítica (Semana 1-2)**
1. US-001: Registro de Usuario
2. US-002: Inicio de Sesión
3. US-004: Nave Espacial Controlable
4. US-007: Conexión WebSocket

### **Alta (Semana 3-5)**
1. US-008: Sincronización de Jugadores
2. US-006: Sistema de Combate Básico
3. US-014: NPCs Enemigos Básicos ⚡
4. US-005: Entorno Espacial Básico
5. US-012: HUD de Juego

### **Media (Semana 5-7)**
1. US-015: Sistema de Oleadas
2. US-009: Salas de Juego
3. US-010: Puntuación en Partida
4. US-011: Estadísticas Post-Partida
5. US-016: IA de NPCs Mejorada
6. US-013: Menú Principal
7. US-003: Perfil de Usuario Básico

---

## 📈 Estimación Total

**Total Story Points:** 112 points (86 + 26 PvE)  
**Sprints estimados:** 4 sprints (2 semanas cada uno)  
**Velocidad estimada:** ~28 points por sprint  

**Quick Wins identificados:** 6 stories (31 points total)  
**Tiempo de Quick Wins:** 12-16 días para MVP completo con PvE  

### **Nuevas estimaciones con PvE:**
- **PvE Básico**: US-014 (8 points) - Quick Win
- **Sistema de Oleadas**: US-015 (5 points)
- **IA Mejorada**: US-016 (13 points)

**Valor agregado del PvE:**
- Modo individual para práctica
- Contenido cuando no hay otros jugadores
- Gameplay más variado y retenido
- Base para futuras expansiones PvE