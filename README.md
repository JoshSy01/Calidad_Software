# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.17.0 create --template minimal --types ts --add prettier sveltekit-adapter="adapter:auto" better-auth="demo:none" drizzle="database:postgresql+postgresql:postgres.js+docker:no" --install npm imperio
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Base de Datos con Docker (Desarrollo y Pruebas)

Este proyecto incluye configuración de Docker Compose para levantar una base de datos PostgreSQL lista para desarrollo local y pruebas aisladas, sin depender de la base de datos remota.

### 1. Iniciar el contenedor

```sh
npm run docker:up
```

Esto descargará (si es necesario) y levantará el contenedor `imperio_postgres` con PostgreSQL 16 y creará automáticamente todas las tablas del sistema definidas en [01-init.sql](file:///c:/Users/justi/Documents/Project%20JP/Imperio-System/docker/init/01-init.sql).

### 2. Configurar la URL de conexión

En tu archivo [.env](file:///c:/Users/justi/Documents/Project%20JP/Imperio-System/.env) (o en tus variables para pruebas):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/imperio_db"
```

### 3. Comandos útiles

- `npm run docker:up`: Inicia el contenedor de base de datos en segundo plano.
- `npm run docker:down`: Detiene el contenedor preservando los datos en el volumen.
- `npm run docker:reset`: Reinicia la base de datos desde cero (elimina volumen y vuelve a ejecutar la inicialización de tablas).
- `npm run db:push:local`: Sincroniza directamente las modificaciones del esquema Drizzle hacia la base de datos local en Docker.
- `npm run db:studio`: Abre la interfaz gráfica web de Drizzle Studio para ver y manipular registros.

