/**
 * Tempo decorrido de uma espera, em `m:ss`.
 *
 * Em segundos corridos ("aguardando há 187s") o número perde o sentido logo no
 * primeiro minuto — e o cold start desta API passa dos três. `m:ss` é lido
 * igual em qualquer um dos cinco idiomas, então o formato não precisa de
 * tradução: só a frase em volta precisa.
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
