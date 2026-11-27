export const AI_FIELD_LIMIT = 2000

/** Potong field teks sebelum masuk prompt/AI supaya payload tidak bisa membengkak. */
export function limitAiText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, AI_FIELD_LIMIT) : ''
}
