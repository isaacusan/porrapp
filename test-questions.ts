import { scoreQuestion } from "./lib/scoring/scoreQuestion";

const T = (name: string, got: number, want: number) => {
  const ok = got === want;
  console.log(`${ok ? "✓" : "✗"} ${name}: ${got} (esperado ${want})`);
  return ok;
};

let pass = 0,
  total = 0;
const check = (n: string, g: number, w: number) => {
  total++;
  if (T(n, g, w)) pass++;
};

// team
check("team correcto", scoreQuestion("team", { team_id: "esp" }, { team_id: "esp" }, 10).points, 10);
check("team incorrecto", scoreQuestion("team", { team_id: "arg" }, { team_id: "esp" }, 10).points, 0);
// player
check("player correcto", scoreQuestion("player", { player_id: "p1" }, { player_id: "p1" }, 8).points, 8);
check("player incorrecto", scoreQuestion("player", { player_id: "p2" }, { player_id: "p1" }, 8).points, 0);
// number
check("number exacto", scoreQuestion("number", { value: 120 }, { value: 120 }, 5).points, 5);
check("number fallado", scoreQuestion("number", { value: 119 }, { value: 120 }, 5).points, 0);
// team_ordered (podio): 2 de 3 posiciones correctas -> round(9 * 2/3) = 6
check(
  "team_ordered parcial",
  scoreQuestion("team_ordered", { team_ids: ["a", "b", "x"] }, { team_ids: ["a", "b", "c"] }, 9).points,
  6,
);
// player_multi: 1 de 2 aciertos -> round(8 * 1/2) = 4
check(
  "player_multi parcial",
  scoreQuestion("player_multi", { player_ids: ["p1", "pz"] }, { player_ids: ["p1", "p2"] }, 8).points,
  4,
);
// sin respuesta
check("sin respuesta", scoreQuestion("team", null, { team_id: "esp" }, 10).points, 0);

console.log(`\n${pass}/${total} OK`);
process.exit(pass === total ? 0 : 1);
