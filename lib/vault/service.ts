import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptBytes, decryptBytes } from './crypto'
import { DbBlobStorageProvider } from './dbBlobStorage'
import type { StorageProvider } from './storageProvider'
import type { DocumentMeta, UploadInput } from './types'
import {
  VaultAccessError,
  VaultValidationError,
  assertAllowedUpload,
  rowToMeta,
  sanitizeFileName,
} from './validation'
import { randomUUID } from 'crypto'

export type VaultDeps = {
  supabase: SupabaseClient
  storage?: StorageProvider
}

function storageFor(supabase: SupabaseClient, override?: StorageProvider): StorageProvider {
  return override || new DbBlobStorageProvider(supabase)
}

async function assertPatientOwned(
  supabase: SupabaseClient,
  doctorId: string,
  patientId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', doctorId)
    .maybeSingle()
  if (error || !data) throw new VaultAccessError('Hasta bulunamadı veya yetkiniz yok')
}

async function assertVisitOwned(
  supabase: SupabaseClient,
  doctorId: string,
  patientId: string,
  visitId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', visitId)
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .maybeSingle()
  if (error || !data) throw new VaultAccessError('Muayene kaydı bulunamadı veya yetkiniz yok')
}

export async function uploadDocument(deps: VaultDeps, input: UploadInput): Promise<DocumentMeta> {
  const { supabase } = deps
  const storage = storageFor(supabase, deps.storage)

  assertAllowedUpload(input.fileType, input.bytes.length, input.fileName)
  await assertPatientOwned(supabase, input.doctorId, input.patientId)
  if (input.visitId) {
    await assertVisitOwned(supabase, input.doctorId, input.patientId, input.visitId)
  }

  const id = randomUUID()
  const storageKey = `db:${id}`
  const fileName = sanitizeFileName(input.fileName)
  const ciphertext = encryptBytes(input.bytes)

  const { data: row, error: insertError } = await supabase
    .from('medical_documents')
    .insert({
      id,
      doctor_id: input.doctorId,
      patient_id: input.patientId,
      visit_id: input.visitId || null,
      file_name: fileName,
      file_type: input.fileType,
      file_size: input.bytes.length,
      uploaded_by: input.uploadedBy,
      notes: input.notes || null,
      category: input.category || null,
      storage_backend: storage.backend,
      storage_key: storageKey,
    })
    .select('*')
    .single()

  if (insertError || !row) {
    throw new Error('Belge kaydı oluşturulamadı')
  }

  try {
    await storage.put({ key: storageKey, data: ciphertext, contentType: input.fileType })
  } catch (e) {
    await supabase.from('medical_documents').delete().eq('id', id)
    throw e
  }

  return rowToMeta(row)
}

export async function listDocuments(
  deps: VaultDeps,
  doctorId: string,
  opts: { patientId?: string; visitId?: string } = {}
): Promise<DocumentMeta[]> {
  let q = deps.supabase
    .from('medical_documents')
    .select('*')
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (opts.patientId) q = q.eq('patient_id', opts.patientId)
  if (opts.visitId) q = q.eq('visit_id', opts.visitId)

  const { data, error } = await q
  if (error) throw new Error('Belgeler listelenemedi')
  return (data || []).map((r) => rowToMeta(r))
}

export async function getDocumentMeta(
  deps: VaultDeps,
  doctorId: string,
  documentId: string
): Promise<DocumentMeta> {
  const { data, error } = await deps.supabase
    .from('medical_documents')
    .select('*')
    .eq('id', documentId)
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error || !data) throw new VaultAccessError()
  return rowToMeta(data)
}

export async function downloadDocument(
  deps: VaultDeps,
  doctorId: string,
  documentId: string
): Promise<{ meta: DocumentMeta; bytes: Buffer }> {
  const meta = await getDocumentMeta(deps, doctorId, documentId)
  const storage = storageFor(deps.supabase, deps.storage)
  const envelope = await storage.get(meta.storageKey)
  const bytes = decryptBytes(envelope)
  return { meta, bytes }
}

export async function softDeleteDocument(
  deps: VaultDeps,
  doctorId: string,
  documentId: string
): Promise<void> {
  const meta = await getDocumentMeta(deps, doctorId, documentId)
  const { error } = await deps.supabase
    .from('medical_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId)
    .eq('doctor_id', doctorId)
  if (error) throw new Error('Belge silinemedi')
  try {
    const storage = storageFor(deps.supabase, deps.storage)
    await storage.delete(meta.storageKey)
  } catch {
    // soft-delete already applied; blob cleanup best-effort
  }
}

export { VaultValidationError, VaultAccessError }
