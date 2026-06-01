import type { Metadata } from "next";

export const metadata: Metadata = { title: "Normas y puntuación · PORRAPP" };

export default function RulesPage() {
  return (
    <>
      <h1>Normas y puntuación</h1>
      <p>
        Estas son las reglas por defecto de PORRAPP. El administrador de cada
        torneo puede ajustarlas, pero la idea general es siempre la misma:
        premiar el acierto fino sin castigar demasiado el fallo.
      </p>

      <h2>Puntos por partido</h2>
      <ul>
        <li>
          <strong>Resultado exacto: 5 puntos.</strong> Clavas el marcador (p. ej.
          predices 2-1 y acaba 2-1).
        </li>
        <li>
          <strong>Diferencia de goles acertada: 3 puntos.</strong> Aciertas al
          ganador y por cuántos goles (predices 2-1 y acaba 3-2).
        </li>
        <li>
          <strong>Signo acertado: 2 puntos.</strong> Aciertas quién gana (o el
          empate), aunque falles el marcador.
        </li>
        <li>
          <strong>Goles de un equipo: +1 punto</strong> por cada equipo cuyo
          número exacto de goles aciertes.
        </li>
        <li>
          <strong>Pasa de ronda (eliminatorias): +2 puntos.</strong> Si hay
          empate a los 90 minutos y aciertas quién se clasifica.
        </li>
      </ul>
      <p>
        Se aplica la mejor opción para ti (no se suman exacto y signo a la vez).
        Nunca se restan puntos por fallar.
      </p>

      <h2>Multiplicadores por fase</h2>
      <p>Cuanto más avanza el torneo, más valen los puntos:</p>
      <ul>
        <li>Fase de grupos: ×1</li>
        <li>Dieciseisavos: ×1,25 · Octavos: ×1,5</li>
        <li>Cuartos: ×2 · Semifinales: ×2,5</li>
        <li>Tercer puesto: ×2 · Final: ×3</li>
      </ul>

      <h2>Preguntas generales</h2>
      <p>
        Las grandes apuestas (campeón, máximo goleador…) dan puntos extra cuando
        el administrador marca la respuesta correcta. Algunas, como un podio,
        reparten puntos parciales si aciertas parte de la respuesta.
      </p>

      <h2>Powerups</h2>
      <p>
        Los cofres por jornada dan powerups que pueden duplicar tus puntos,
        protegerte de un cero, sumar un gol a tu predicción o incluso sabotear la
        de un rival. Quien va por detrás en la clasificación tiene más opciones de
        sacar powerups raros.
      </p>

      <p>
        ¿Dudas con una jugada concreta? Pregunta al administrador de tu torneo,
        que puede ver el desglose de cada puntuación.
      </p>
    </>
  );
}
