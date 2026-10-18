type Card = {
};

const data = JSON.parse(
  await Deno.readTextFile(new URL("./data.json", import.meta.url)),
);

const cards = data.cards as Card[];

function cardsHandler(_request: Request): Response {
  return Response.json(cards);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve({ port: 8000 }, (request) => {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/cards") {
    return cardsHandler(request);
  }

  return json({ message: "Endpoint no encontrado" }, 404);
});

console.log("API ejecutándose en http://localhost:8000");
