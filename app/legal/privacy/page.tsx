import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidad · PORRAPP" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacidad</h1>
      <p>
        PORRAPP es una porra privada entre amigos. Nos tomamos en serio tus datos
        y solo guardamos lo imprescindible para que la porra funcione.
      </p>

      <h2>Qué guardamos</h2>
      <ul>
        <li>
          <strong>Tu cuenta:</strong> email y nombre de usuario. La contraseña se
          guarda cifrada por el sistema de autenticación; nadie, ni el
          administrador, puede verla.
        </li>
        <li>
          <strong>Tu actividad en cada torneo:</strong> tu nombre visible, tus
          predicciones, tus respuestas a las preguntas y tus powerups.
        </li>
      </ul>

      <h2>Quién puede ver qué</h2>
      <p>
        Tus predicciones y respuestas son <strong>privadas</strong> hasta que
        empieza el partido o se cierran las preguntas; entonces se revelan al
        resto de jugadores de tu torneo. Esto lo controla la propia base de datos,
        no solo la pantalla. Nadie fuera de tu torneo ve tu actividad.
      </p>

      <h2>Lo que NO hacemos</h2>
      <ul>
        <li>No vendemos ni compartimos tus datos con terceros.</li>
        <li>No mostramos publicidad.</li>
        <li>No usamos tus datos para nada que no sea la propia porra.</li>
      </ul>

      <h2>Borrar tus datos</h2>
      <p>
        Puedes salir de un torneo cuando quieras. Si quieres eliminar tu cuenta
        por completo, contacta con quien administre la instalación de PORRAPP que
        estés usando.
      </p>

      <p>
        Para datos de fútbol, PORRAPP puede conectarse a APIs externas (como
        football-data.org u openfootball). Esas peticiones no envían información
        personal tuya.
      </p>
    </>
  );
}
