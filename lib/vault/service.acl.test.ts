/**
 * Service-level ACL tests with a fake supabase stub.
 * Ensures doctor A cannot download doctor B's document metadata path.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryStorageProvider } from './dbBlobStorage'
import { downloadDocument, uploadDocument, VaultAccessError } from './service'
import { encryptBytes } from './crypto'

type Row = Record<string, unknown>

function makeFakeSupabase(opts: {
  patients: Row[]
  sessions: Row[]
  documents: Row[]
}) {
  const blobs = new Map<string, string>()
  const state = {
    patients: [...opts.patients],
    sessions: [...opts.sessions],
    documents: [...opts.documents],
  }

  const api = {
    from(table: string) {
      const filters: Array<(r: Row) => boolean> = []
      let limitN: number | null = null
      let single = false
      let maybeSingle = false
      let insertPayload: Row | null = null
      let updatePayload: Row | null = null
      let deleting = false

      const builder: Record<string, unknown> = {
        select(_cols?: string) {
          return builder
        },
        insert(payload: Row) {
          insertPayload = payload
          return builder
        },
        update(payload: Row) {
          updatePayload = payload
          return builder
        },
        delete() {
          deleting = true
          return builder
        },
        eq(col: string, val: unknown) {
          filters.push((r) => r[col] === val)
          return builder
        },
        is(col: string, val: null) {
          filters.push((r) => r[col] == null)
          return builder
        },
        order() {
          return builder
        },
        limit(n: number) {
          limitN = n
          return builder
        },
        maybeSingle() {
          maybeSingle = true
          return builder.then ? builder : finalize()
        },
        single() {
          single = true
          return finalize()
        },
        then(resolve: (v: unknown) => void, reject?: (e: unknown) => void) {
          return finalize().then(resolve, reject)
        },
      }

      async function finalize() {
        const tableRows =
          table === 'patients' ? state.patients : table === 'sessions' ? state.sessions : state.documents

        if (insertPayload && table === 'medical_documents') {
          const row = { ...insertPayload, created_at: new Date().toISOString(), deleted_at: null }
          state.documents.push(row)
          return { data: row, error: null }
        }

        if (updatePayload && table === 'medical_documents') {
          for (const r of state.documents) {
            if (filters.every((f) => f(r))) Object.assign(r, updatePayload)
          }
          return { data: null, error: null }
        }

        if (deleting && table === 'medical_document_blobs') {
          return { data: null, error: null }
        }

        let rows = tableRows.filter((r) => filters.every((f) => f(r)))
        if (limitN != null) rows = rows.slice(0, limitN)

        if (single || maybeSingle) {
          const data = rows[0] || null
          if (single && !data) return { data: null, error: { message: 'not found' } }
          return { data, error: null }
        }
        return { data: rows, error: null }
      }

      // maybeSingle returns a thenable in our stub via finalize when awaited —
      // attach thenable behavior for chains ending in maybeSingle without single().
      ;(builder as { then?: unknown }).then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
        finalize().then(resolve, reject)

      return builder
    },
    async rpc(name: string, args: Record<string, string>) {
      if (name === 'vault_put_blob') {
        blobs.set(args.p_document_id, args.p_ciphertext_b64)
        return { data: null, error: null }
      }
      if (name === 'vault_get_blob') {
        const v = blobs.get(args.p_document_id)
        return { data: v || null, error: v ? null : { message: 'missing' } }
      }
      return { data: null, error: { message: 'unknown rpc' } }
    },
    _blobs: blobs,
    _state: state,
  }

  return api
}

describe('vault upload/download ACL', () => {
  before(() => {
    process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'test-master-key-notya-vault-unit'
  })

  it('upload then download as owning doctor', async () => {
    const doctorId = 'doc-a'
    const patientId = 'pat-1'
    const fake = makeFakeSupabase({
      patients: [{ id: patientId, doctor_id: doctorId }],
      sessions: [],
      documents: [],
    })
    const memory = new MemoryStorageProvider()

    // Bridge memory store with our service by wrapping put to also keep ciphertext decryptable path:
    // service encrypts then storage.put — MemoryStorageProvider is enough if we inject it.
    const meta = await uploadDocument(
      { supabase: fake as never, storage: memory },
      {
        doctorId,
        patientId,
        fileName: 'ekg.jpg',
        fileType: 'image/jpeg',
        bytes: Buffer.from('fake-jpeg-bytes'),
        uploadedBy: doctorId,
        category: 'EKG',
      }
    )

    assert.equal(meta.patientId, patientId)
    assert.equal(meta.fileType, 'image/jpeg')

    const { bytes } = await downloadDocument(
      { supabase: fake as never, storage: memory },
      doctorId,
      meta.id
    )
    assert.equal(bytes.toString(), 'fake-jpeg-bytes')
  })

  it('rejects download for non-owner doctor', async () => {
    const owner = 'doc-a'
    const other = 'doc-b'
    const patientId = 'pat-1'
    const docId = 'doc-1'
    const key = `db:${docId}`
    const memory = new MemoryStorageProvider()
    await memory.put({ key, data: encryptBytes(Buffer.from('secret')) })

    const fake = makeFakeSupabase({
      patients: [{ id: patientId, doctor_id: owner }],
      sessions: [],
      documents: [
        {
          id: docId,
          doctor_id: owner,
          patient_id: patientId,
          visit_id: null,
          file_name: 'x.jpg',
          file_type: 'image/jpeg',
          file_size: 6,
          uploaded_by: owner,
          notes: null,
          category: 'X-Ray',
          storage_backend: 'db',
          storage_key: key,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
      ],
    })

    await assert.rejects(
      () => downloadDocument({ supabase: fake as never, storage: memory }, other, docId),
      (e: unknown) => e instanceof VaultAccessError
    )
  })

  it('rejects upload when patient is not owned', async () => {
    const fake = makeFakeSupabase({
      patients: [{ id: 'pat-1', doctor_id: 'doc-a' }],
      sessions: [],
      documents: [],
    })
    await assert.rejects(
      () =>
        uploadDocument(
          { supabase: fake as never, storage: new MemoryStorageProvider() },
          {
            doctorId: 'doc-b',
            patientId: 'pat-1',
            fileName: 'x.jpg',
            fileType: 'image/jpeg',
            bytes: Buffer.from('x'),
            uploadedBy: 'doc-b',
          }
        ),
      (e: unknown) => e instanceof VaultAccessError
    )
  })
})
