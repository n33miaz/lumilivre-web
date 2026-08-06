/**
 * Tamanho mínimo da senha, em um lugar só.
 *
 * O número aparecia cravado tanto na condição de validação quanto no texto
 * ("no mínimo 6 caracteres"). Com as duas cópias, traduzir a frase — ou ajustar
 * a regra — mudava um lado sem o outro e a mensagem passava a mentir. Aqui a
 * constante alimenta a condição e entra na frase por interpolação (`{{min}}`).
 */
export const MIN_PASSWORD_LENGTH = 6;
