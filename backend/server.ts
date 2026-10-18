// All types
type ElementType = "Grass" | "Fire" | "Water" | "Electric" | "Psychic" | "Fighting" | "Dark" | "Steel" | "Dragon" | "Colorless" | "Fairy" | "Metal";

type EnergyCost = {
  [key in Lowercase<ElementType>]?: number;
};

// All status conditions
type StatusCondition = "asleep" | "poisoned" | "paralyzed" | "cannot_attack";

//All attack effects
type AttackEffect = {
  action: "heal" | "search_deck" | "apply_status" | "switch_opponent_active" 
    | "coin_flip" | "move_energy" | "bonus_damage_per_energy" | "bonus_damage" 
    | "prevent_supporters" | "counter_damage" | "reduce_damage" | "target_any" 
    | "damage_benched" | "deal_damage" | "prevent_damage" | "attach_energy" 
    | "copy_opponent_attack" | "discard_energy" | "discard_random_card" | "draw_card" 
    | "shuffle_opponent_active" | "reveal_hand"| "coin_flip_multiple";
  target?: "self" | "grass_pokemon" | "all_your_pokemon" | "opponent_active" | "benched_pokemon" | "opponent" | "opponent_pokemon" | "opponent_hand";
  amount?: number | "equal_to_damage" | "coin_flip_total";
  status?: StatusCondition;
  condition?: "once_per_turn" | "heads" | "each_heads" | "tails" | "if_damaged_by_attack" | "if_opponent_damaged" | "next_turn" | "coin_flip_heads";
  description?: string;
  bonus_damage?: number;
  multiplier?: number;
  source?: "energy_zone" | "discard_pile";
  self_damage_on_tails?: number;
  count?: number;
  bonus_damage_per_heads?: number;
  bonus_damage_per_benched?: number;
  bonus_damage_per_bench?: number;
  bonus_damage_if_damaged?: number;
  bonus_damage_if_status?: StatusCondition;
  bonus_damage_per_nido?: number;
};

//All possible global effects (Pokémon Powers and Abilities)
type GlobalEffect = {
  action: "heal" | "switch_opponent_active" | "prevent_supporters" | "disable_supporters" | "coin_flip" | "attach_energy" | "spread_poison" | "reduce_damage" | "move_energy" | "reveal_top_card" | "switch_opponent_pokemon";
  target?: "all_your_pokemon" | "self";
  amount?: number;
  condition?: "once_per_turn";
  description?: string;
};

//Final Card that combines above types into single array
type Card = {
  name: string;
  type: ElementType;
  hp: number;
  weakness: ElementType | null; // Always a single element string or null
  attacks: {
    name: string;
    cost: EnergyCost;
    damage: number | null; 
    effect: AttackEffect | null; 
  }[];
  retreat_cost: number;
  stage: "Basic" | "Stage 1" | "Stage 2" | "EX"; // Captures all variations up through EX prints
  effect: GlobalEffect | null; // Captures unique Pokémon Powers and Abilities
  image: string;
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
