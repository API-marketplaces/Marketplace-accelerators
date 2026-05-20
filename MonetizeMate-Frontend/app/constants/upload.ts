const DEFAULT_MAX_UPLOAD_SIZE_MB = 250

const configuredMaxUploadSizeMb = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? DEFAULT_MAX_UPLOAD_SIZE_MB
)

export const MAX_UPLOAD_SIZE_MB =
  Number.isFinite(configuredMaxUploadSizeMb) && configuredMaxUploadSizeMb > 0
    ? configuredMaxUploadSizeMb
    : DEFAULT_MAX_UPLOAD_SIZE_MB

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

export function formatUploadLimit() {
  return `${MAX_UPLOAD_SIZE_MB} MB`
}

export function assertFileWithinUploadLimit(file: File) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File is too large. Maximum allowed size is ${formatUploadLimit()}.`)
  }
}
