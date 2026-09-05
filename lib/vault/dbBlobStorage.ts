import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageProvider, PutObjectInput } from './storageProvider'

/**
 * Postgres BYTEA backend via SECURITY DEFINER RPCs (base64 ↔ bytea).
 * `key` is `db:{documentId}` so get/delete resolve the document row.
 */
export class DbBlobStorageProvider implements StorageProvider {
  readonly backend = 'db' as const

  constructor(private readonly supabase: SupabaseClient) {}

  private documentIdFromKey(key: string): string {
    if (!key.startsWith('db:')) {
      throw new Error('Geçersiz depolama anahtarı')
    }
    return key.slice(3)
  }

  async put(input: PutObjectInput): Promise<void> {
    const documentId = this.documentIdFromKey(input.key)
    const { error } = await this.supabase.rpc('vault_put_blob', {
      p_document_id: documentId,
      p_ciphertext_b64: input.data.toString('base64'),
    })
    if (error) throw new Error('Dosya kaydedilemedi')
  }

  async get(key: string): Promise<Buffer> {
    const documentId = this.documentIdFromKey(key)
    const { data, error } = await this.supabase.rpc('vault_get_blob', {
      p_document_id: documentId,
    })
    if (error || typeof data !== 'string' || !data) {
      throw new Error('Dosya bulunamadı')
    }
    return Buffer.from(data, 'base64')
  }

  async delete(key: string): Promise<void> {
    const documentId = this.documentIdFromKey(key)
    const { error } = await this.supabase.from('medical_document_blobs').delete().eq('document_id', documentId)
    if (error) throw new Error('Dosya silinemedi')
  }
}

/** In-memory provider for unit tests (no DB). */
export class MemoryStorageProvider implements StorageProvider {
  readonly backend = 'db' as const
  private store = new Map<string, Buffer>()

  async put(input: PutObjectInput): Promise<void> {
    this.store.set(input.key, Buffer.from(input.data))
  }

  async get(key: string): Promise<Buffer> {
    const v = this.store.get(key)
    if (!v) throw new Error('Dosya bulunamadı')
    return Buffer.from(v)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}
