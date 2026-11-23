POKERECORDS - CATÁLOGO E INVENTARIO DE CARTAS POKÉMON
=====================================================

Estado: versión funcional avanzada; etapa de validación y cierre.
Fecha de actualización de este documento: 23 de noviembre de 2026.
Repositorio: https://github.com/Mauricio6945/Proyecto-Pokedex


1. DESCRIPCIÓN DEL PROYECTO
---------------------------
PokéRecords es una aplicación web que permite consultar un catálogo de cartas
Pokémon, identificar posibles coincidencias a partir de imágenes y administrar
una colección personal. 

Los visitantes pueden explorar las cartas. 

Los usuarios que inician sesión con Google pueden agregar cartas a su inventario, organizar
mazos, consultar su historial y revisar el progreso de sus colecciones..

La aplicación está dividida en un frontend desarrollado con React y Vite, y un
backend en Deno que expone una API HTTP y almacena los datos de cada usuario en
SQLite. El despliegue del proyecto está configurado para usar Vercel (frontend)
, Render y Deno (backend).


2. FUNCIONALIDADES DISPONIBLES
------------------------------
2.1. Catálogo público

- Visualización de las cartas disponibles, con imágenes e información de
  nombre, número de Pokédex, tipo, rareza, variante y expansión.

- Precio de referencia en dólares estadounidenses (price_usd).

- Cantidad total y cantidad disponible para añadir de cada carta.

- Búsqueda por nombre y filtros combinables por rareza, expansión y variante.

- Organización visual por número de Pokédex: cada especie aparece inicialmente
  como un encabezado plegado. Al abrirlo se muestran todas las cartas y
  variantes de esa especie, agrupadas bajo el nombre general de Pokédex. Esto
  se aplica al catálogo y al inventario; en mazos y resultados del escáner las
  cartas de cada especie se muestran directamente.

- Estilos diferenciados según el tipo de Pokémon.

- Descripciones en español o inglés al situar el puntero sobre la imagen
  de una carta o al darle el foco mediante teclado.

2.2. Inicio de sesión y usuarios
  - Inicio de sesión mediante Google SSO (OAuth 2.0/OpenID Connect).
  - La pantalla del catálogo informa a los visitantes qué funciones personales
    se habilitan al iniciar sesión: inventario e intercambios, escáner OCR,
    mazos, historial y progreso de colección.
  - Validación de identidad en el backend mediante JWT de Google.
  - Sesiones mantenidas con cookies HTTP-only.
  - Cierre de sesión y acceso protegido a las funciones personales.
  - Separación de los inventarios, mazos e historiales por usuario.

2.3. Inventario personal
  - Incorporación de cartas a traves el catálogo o el lector de imágenes.
  - Registro de varias copias de una misma carta.
  - Eliminación de copias del inventario.
  - Consulta de cantidades propias y disponibilidad para intercambio.
  - Ajuste manual de cuántas copias del usuario se ofrecen para intercambio,
    sin superar el número de copias que posee.
  - Actualización de los datos al realizar operaciones de inventario.

2.4. Colecciones y cartas faltantes
  - Conteo de cartas diferentes poseídas por expansión.
  - Presentación del avance de cada set (cartas obtenidas / cartas del set).
  - Cada set tiene una sección desplegable que muestra sus cartas faltantes;
    si el usuario completó el set, se indica que ya posee todas sus cartas.
  - Distinción entre variantes individuales y el Pokémon al que pertenecen.

2.5. Administración de mazos
  - Creación de mazos con nombres personalizados.
  - Incorporación de cartas del inventario a un mazo.
  - Control de copias disponibles para agregar a cada mazo.
  - Cambio de nombre y eliminación de mazos.
  - Eliminación de una carta de un mazo.
  - Visualización de las cartas y cantidades incluidas en cada mazo.

2.6. Escaneo de cartas
  - Carga de imágenes de cartas desde el dispositivo del usuario.
  - Selector de archivos con estilo gris, foco visible y estados interactivos.
  - Reconocimiento óptico de texto (OCR) con Tesseract.js.
  - Ordenamiento de sugerencias de cartas según el texto reconocido.
  - Búsqueda manual como alternativa cuando el OCR no encuentra resultados.
  - Resultados agrupados por especie, con las cartas visibles inmediatamente.
  - Selección de la carta correcta y posibilidad de añadirla al inventario.

2.7. Historial de movimientos
  - Historial individual por usuario, con nombre de carta, expansión y fecha.
  - Al añadir una carta se registra un evento de tipo "buy" (compra).
  - Al quitar una copia se registra un evento de tipo "sell" (venta).

  - IMPORTANTE: son movimientos de inventario interpretados como compra/venta;
    no existe integración con pagos ni registro de un precio real de transacción.

2.8. Idiomas y experiencia de usuario
  - Interfaz en español e inglés mediante traducciones propias del proyecto.
  - Descripciones de Pokémon disponibles en ambos idiomas; aparecen al pasar
    el puntero sobre la imagen de la carta o al enfocarla con el teclado.
  - En móviles, la descripción aparece en un panel compacto dentro del borde
    derecho de la carta para evitar que se salga de la pantalla.
  - Los grupos de cartas usan el nombre general de pokedex.json como categoría;
    cada CardLayout muestra el nombre específico de la carta, incluidas sus
    variantes (por ejemplo, EX).
  - Preferencia de idioma guardada en localStorage del navegador.
  - Interfaz adaptable, con ajustes específicos para pantallas pequeñas.
  - Indicaciones de carga y errores; interacciones visuales y efectos hover.


3. DATOS DEL CATÁLOGO
----------------------
Los archivos incluidos en esta versión contienen:
  - 498 registros de cartas en backend/pokemon.json.
  - 14 expansiones representadas en el catálogo.
  - 898 entradas descriptivas en backend/pokedex.json (Incluyendo pokemones futuros/no añadidos).
  - Correspondencia de los 498 registros de cartas con entradas de Pokédex.

Entre las expansiones figuran Base Set, Jungle, Fossil, Team Rocket,
Neo Genesis, Gym Heroes, Gym Challenge y diversas expansiones EX y promocionales.

El catálogo contiene cartas de Pokémon de distintas generaciones; no se limita
exclusivamente a la primera generación.

Campos destacados del catálogo: id, pokedex_number, name, type, rarity,
variant, expansion, set_id, card_number, price_usd, image, amount y
trade_available. El backend complementa cada carta con el nombre general y las
descripciones en español e inglés provenientes de pokedex.json.

Los precios son estimaciones almacenadas en el JSON, no cotizaciones del mercado
en tiempo real. Las imágenes de cartas se cargan desde direcciones externas.


4. TECNOLOGÍAS Y ESTRUCTURA
----------------------------
Frontend:
  - React y JavaScript (JSX).
  - Vite para desarrollo y compilación.
  - CSS propio para componentes y diseño adaptable.
  - Tesseract.js para el OCR en el navegador.

Backend:
  - Deno 2.8 (imagen Docker utilizada en el proyecto).
  - API HTTP implementada en TypeScript mediante Deno.serve.
  - SQLite con node: sqlite para usuarios, sesiones, inventario, stock,
    movimientos de inventario y mazos.
  - Google OAuth 2.0 / OpenID Connect, con verificación de ID tokens mediante jose.

Estructura principal del repositorio:

  Proyecto-Pokedex-main/
  |-README.txt                Documentacion principal
  |
  |
  |-backend/ 
  |   |-server.ts             Servidor HTTP, autenticación y endpoints
  |   |-pokemon.json          Catálogo de cartas
  |   |-pokedex.json          Nombres generales y descripciones bilingües
  |   |-deno.json             Configuración de Deno
  |   |-deno.lock             Archivo de bloqueo de dependencias
  |   `- Dockerfile            Construcción del backend para Render
  |
  |
  `-- frontend/
      |-- package.json          Dependencias y scripts
      |-- vite.config.js        Vite y proxy local hacia el backend
      |-- vercel.json           Reescrituras de rutas para producción
      `-- src/
          |-- App.jsx           Navegación y estado principal
          |-- i18n.jsx          Traducciones y preferencia de idioma
          |-- api/Cardapi.js    Cliente de la API
          |-- components/       Catálogo, escáner, mazos e inventario
          `-- styles.css        Diseño visual

Nota: los archivos .env, credenciales y bases de datos locales no estan
publicados en el repositorio. El archivo .gitignore excluye estos elementos.


5. INSTRUCCIONES DE INSTALACIÓN Y EJECUCIÓN LOCAL
--------------------------------------------------
Requisitos previos:
  - Git, Deno compatible con la versión del proyecto (referencia: Deno 2.8),
    Node.js y npm compatibles con la versión de Vite instalada.
  - Acceso a un proyecto OAuth de Google con Client ID y Client Secret.
  - Acceso a Internet para autenticarse y cargar las imágenes remotas.

Paso 1. Obtener el código:
  git clone https://github.com/Mauricio6945/Proyecto-Pokedex.git
  cd Proyecto-Pokedex

Paso 2. Configurar Google OAuth en el backend:
  - Crear backend/.env y definir las variables siguientes:

    GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=TU_GOOGLE_CLIENT_SECRET
    FRONTEND_ORIGIN=http://localhost:5173
    PORT=8000

  - POKEDEX_DB_PATH es opcional; si se omite, SQLite se creará como
    backend/pokedex.db. Si se define, debe apuntar a una ruta escribible.
  - En Google Cloud, configurar la URI de redirección autorizada:
    http://localhost:5173/auth/google/callback
  - No subir el archivo .env a GitHub.

Paso 3. Iniciar el backend en una terminal:
  cd backend
  deno run -A --env-file=.env server.ts

  Por defecto, la API responderá en http://localhost:8000.
  Prueba rápida: http://localhost:8000/api/health debe devolver {"ok":true}.

Paso 4. Iniciar el frontend en otra terminal, desde la raíz del proyecto:
  cd frontend
  npm ci
  npm run dev

  Abrir http://localhost:5173 en el navegador.
  El proxy de vite.config.js redirige /api y /auth a localhost:8000.
  Ambos servidores deben permanecer encendidos durante el desarrollo local.

Paso 5. Compilación de producción del frontend (opcional):
  cd frontend
  npm run build

  Los archivos generados se guardan en frontend/dist.



6. DESPLIEGUE: VERCEL + RENDER
-------------------------------
Backend (Render):
  - Servicio Docker construido a partir de backend/Dockerfile, usando backend
    como directorio de trabajo o raíz del servicio.
  - El Dockerfile copia server.ts, pokemon.json y pokedex.json a /app.
  - La imagen usa Deno 2.8 y expone el puerto 10000 por defecto.
  - Configurar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y FRONTEND_ORIGIN en las
    variables de entorno del servicio. PORT puede ser suministrado por Render.
  - Para conservar SQLite entre despliegues/reinicios se necesita almacenamiento
    persistente y una ruta POKEDEX_DB_PATH apropiada. De lo contrario, los
    datos guardados en el sistema de archivos del contenedor podrían perderse.

Frontend (Vercel):
  - Directorio raíz del proyecto en Vercel: frontend.
  - Comando de compilación: npm run build.
  - Directorio de salida: dist.
  - frontend/vercel.json reenvía /api/* y /auth/* al backend se encuentra desplegado en
    https://proyecto-pokedex-e9uj.onrender.com y redirige el resto a index.html.
  - Comprobar que esa URL coincida con la dirección vigente de Render.
  - FRONTEND_ORIGIN debe coincidir exactamente con el dominio público HTTPS de
    Vercel (sin barra final). Registra también en Google Cloud la redirección:
    https://proyecto-pokedex-c26l.vercel.app/auth/google/callback.
  - No exponer secretos OAuth en variables en frontend, ni repositorio.

Comprobaciones recomendadas luego de un despliegue:
  - GET /api/health responde correctamente desde Vercel.
  - El catálogo se carga y las descripciones aparecen en ambos idiomas.
  - El login con Google y el cierre de sesión funcionan.
  - Los datos de inventario y mazos se mantienen al volver a iniciar sesión.
  - Los datos persisten tras volver a desplegar el backend.


7. ENDPOINTS PRINCIPALES DE LA API
----------------------------------
Públicos:
  GET     /api/health                  Estado del servidor
  GET     /api/cards                   Catálogo y descripciones

Autenticación:
  GET     /auth/google                 Inicio de login con Google
  GET     /auth/google/callback        Respuesta OAuth de Google
  GET     /api/me                      Usuario de la sesión actual
  POST    /auth/logout                 Cierre de sesión

Inventario e historial (requieren autenticación):
  GET     /api/inventory               Consultar inventario
  POST    /api/inventory               Añadir una copia de carta
  DELETE  /api/inventory/:cardId       Quitar una copia de carta
  PUT     /api/inventory/:cardId/trade-available
                                        Actualizar copias para intercambio
  GET     /api/history                 Consultar historial personal

Mazos (requieren autenticación):
  GET     /api/decks                   Listar mazos
  POST    /api/decks                   Crear mazo
  PUT     /api/decks/:deckId           Cambiar nombre
  DELETE  /api/decks/:deckId           Eliminar mazo
  POST    /api/decks/:deckId/cards     Añadir carta al mazo
  DELETE  /api/decks/:deckId/cards/:cardId
                                        Quitar carta del mazo


Las operaciones que modifican datos validan el origen de la solicitud; por eso
FRONTEND_ORIGIN debe estar configurado correctamente.

8. REGISTRO RESUMIDO DE CAMBIOS
--------------------------------
Los siguientes cambios se elaboraron a partir de las capturas suministradas del
historial de commits. No sustituyen la revisión del historial completo de GitHub.

26 de octubre de 2026:
  - Primeras mejoras visuales, imagen, barra de búsqueda y estilos del frontend.

14 de noviembre de 2026:
  - Implementación de búsqueda funcional y filtros para el catálogo.

15 de noviembre de 2026:
  - Incorporación de autenticación y agregado de cartas al inventario.

16 de noviembre de 2026:
  - Comentarios y documentación dentro del código de server.ts.

17 de noviembre de 2026:
  - Incorporación del Dockerfile, .dockerignore y configuración de Vercel.
  - Ajustes de las redirecciones necesarias para el despliegue.

18 de noviembre de 2026:
  - Mejoras de diseño responsive, efectos de botones y estilos personalizados.
  - Agrupación de componentes y reorganización visual de las cartas.
  - Selector de español/inglés y administración de mazos.
  - Recuento de cartas por set y escaneo con sugerencias basadas en OCR.

19 de noviembre de 2026:
  - Nuevas operaciones de mazos: renombrar, borrar y quitar cartas.
  - Incorporación de precio, cantidad y disponibilidad de intercambio al catálogo.
  - Visualización de cantidades disponibles y registro de movimientos.
  - Adición de pokedex.json y descripciones en español e inglés.
  - Corrección del Dockerfile para incluir pokedex.json en Render.
  - Ajustes del efecto de descripción, scrollbar y limpieza de módulos.
  - Incorporación de la lista de cartas faltantes por expansión.
  - Agrupación de variantes bajo el nombre general del Pokémon.
  - Nuevos cambios de presentación, botones y colores.
  - Agrupación por el nombre de Pokédex y conservación del nombre específico
    de cada carta en su tarjeta.
  - Desplegable de cartas faltantes por set y mejoras visuales del selector
    de archivos del escáner.

22 de noviembre de 2026:
  - Ajuste móvil del panel de descripción para que quede compacto a la derecha
    de la carta y permanezca dentro de la pantalla.
  - Aviso bilingüe en el catálogo con las funciones que se desbloquean al
    iniciar sesión.

23 de noviembre de 2026:
  - Acordeones por especie en el catálogo y el inventario.
  - Cartas visibles inmediatamente en cada mazo y en los resultados del escáner.

9. CRÉDITOS Y NOTAS
---------------------
Proyecto académico individual de la asignatura Diseño de Software (TICS316).

Tecnologías y servicios utilizados: React, Vite, Deno, SQLite, Tesseract.js,
Google OAuth, Vercel y Render. Las imágenes remotas de cartas del catálogo
utilizan direcciones del dominio assets.tcgdex.net.

Pokémon y sus denominaciones pertenecen a sus respectivos titulares de derechos.
Proyecto educativo, sin relación oficial con la franquicia Pokémon.
