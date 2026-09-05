/**
 * Swappable storage layer for the medical document vault.
 * Beta: DbBlobStorageProvider. Later: S3/R2 without changing API routes.
 */

export type PutObjectInput = {
  /** Opaque key owned by the vault service (includes document id). */
  key: string
  /** Already-encrypted ciphertext (provider must not re-encrypt). */
  data: Buffer
  contentType?: string
}

export interface StorageProvider {
  readonly backend: 'db' | 's3' | 'r2'
  put(input: PutObjectInput): Promise<void>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
}
