const dataPath = new URL("./pokemon.json", import.meta.url);

async function cardsHandler(_request: Request): Promise<Response> {
  const fileContents = await Deno.readTextFile(dataPath);
  const cards = JSON.parse(fileContents);

  return Response.json(cards, {
    headers: {
      "access-control-allow-origin": "*",
    },
  });
}

Deno.serve({ port: 8000 }, async (request) => {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/cards") {
    return await cardsHandler(request);
  }

  
  return new Response(JSON.stringify({ message: "Endpoint no encontrado" }), {
    status: 404,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
});

console.log("API ejecutándose en http://localhost:8000");
