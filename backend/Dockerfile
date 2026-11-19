#Backend independiente: el frontend NO se copia a esta imagen.
#Deno 2.8 incluye node:sqlite para el inventario.
FROM denoland/deno:2.8.0

WORKDIR /app
COPY deno.json deno.lock server.ts pokemon.json pokedex.json ./
#Necesario para que el usuario deno pueda escribir la base SQLite local.
RUN chown -R deno:deno /app
USER deno
RUN deno cache server.ts

ENV PORT=10000
EXPOSE 10000
CMD ["run", "-A", "server.ts"]
