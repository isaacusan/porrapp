import type { Metadata } from "next";

export const metadata: Metadata = { title: "Condiciones · PORRAPP" };

export default function TermsPage() {
  return (
    <>
      <h1>Condiciones de uso</h1>
      <p>
        PORRAPP es una aplicación para organizar porras de fútbol entre amigos,
        por diversión. Al usarla, aceptas lo siguiente.
      </p>

      <h2>Uso responsable</h2>
      <ul>
        <li>Trata bien al resto de jugadores. Las porras son para pasarlo bien.</li>
        <li>
          No intentes acceder a las predicciones de otros antes de tiempo ni
          manipular los resultados.
        </li>
        <li>Eres responsable de mantener tu contraseña a salvo.</li>
      </ul>

      <h2>Apuestas y dinero</h2>
      <p>
        PORRAPP es una herramienta para llevar la cuenta de aciertos y puntos. No
        gestiona dinero ni pagos. Cualquier acuerdo económico entre los jugadores
        es cosa vuestra y queda completamente fuera de la aplicación.
      </p>

      <h2>Sin garantías</h2>
      <p>
        La aplicación se ofrece “tal cual”. Los resultados que vienen de APIs
        externas pueden tener errores o retrasos; el administrador del torneo
        puede corregir cualquier marcador a mano. Hacemos lo posible por que todo
        funcione, pero no garantizamos disponibilidad ininterrumpida.
      </p>

      <h2>Datos</h2>
      <p>
        El tratamiento de tus datos se describe en la página de{" "}
        <a href="/legal/privacy">Privacidad</a>.
      </p>
    </>
  );
}
