// ============================================================
// NOTYA AI - Denetim Kaydı (KVKK Madde 12)
// Her veri erişimi kayıt altına alınır
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { AuditAction } from '@/types/notya'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AuditEntry {
  user_id?: string
  action: AuditAction | string
  resource_type: string
  resource_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  success?: boolean
  error_message?: string
}

/**
 * Veri erişim olayını kaydet
 */
export async function logAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  request?: Request
): Promise<void> {
  await writeAuditLog({
    user_id: userId,
    action: 'view',
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: getClientIP(request),
    user_agent: request?.headers.get('user-agent') || undefined,
    success: true,
  })
}

/**
 * Not onayını kaydet
 */
export async function logNoteApproval(
  userId: string,
  noteId: string,
  request?: Request
): Promise<void> {
  await writeAuditLog({
    user_id: userId,
    action: 'approve',
    resource_type: 'note',
    resource_id: noteId,
    ip_address: getClientIP(request),
    user_agent: request?.headers.get('user-agent') || undefined,
    success: true,
  })
}

/**
 * Veri ihracını kaydet (KVKK zorunlu)
 */
export async function logDataExport(
  userId: string,
  dataType: string,
  recordCount: number,
  request?: Request
): Promise<void> {
  await writeAuditLog({
    user_id: userId,
    action: 'export',
    resource_type: dataType,
    new_values: { record_count: recordCount, exported_at: new Date().toISOString() },
    ip_address: getClientIP(request),
    user_agent: request?.headers.get('user-agent') || undefined,
    success: true,
  })
}

/**
 * KVKK rızasını kaydet
 */
export async function logConsentGiven(
  userId: string,
  patientId: string,
  consentType: string,
  request?: Request
): Promise<void> {
  await writeAuditLog({
    user_id: userId,
    action: 'create',
    resource_type: 'consent',
    resource_id: patientId,
    new_values: { consent_type: consentType, given_at: new Date().toISOString() },
    ip_address: getClientIP(request),
    success: true,
  })
}

/**
 * Başarısız erişim denemesini kaydet
 */
export async function logFailedAccess(
  userId: string | undefined,
  resourceType: string,
  errorMessage: string,
  request?: Request
): Promise<void> {
  await writeAuditLog({
    user_id: userId,
    action: 'view',
    resource_type: resourceType,
    ip_address: getClientIP(request),
    user_agent: request?.headers.get('user-agent') || undefined,
    success: false,
    error_message: errorMessage,
  })
}

/**
 * Ses dosyası silme işlemini kaydet
 */
export async function logAudioDeletion(
  userId: string,
  sessionId: string
): Promise<void> {
  await writeAuditLog({
    user_id: userId,
    action: 'delete',
    resource_type: 'audio',
    resource_id: sessionId,
    new_values: { deleted_at: new Date().toISOString(), reason: 'KVKK veri minimizasyonu' },
    success: true,
  })
}

// ============================================================
// İÇ YARDIMCILAR
// ============================================================

async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.user_id || null,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id || null,
        old_values: entry.old_values || null,
        new_values: entry.new_values || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
        success: entry.success !== false,
        error_message: entry.error_message || null,
      })
    
    if (error) {
      // Denetim kaydı hatasını sessizce logla - asıl işlemi durdurma
      console.error('[AuditLogger] Kayıt hatası:', error.message)
    }
  } catch (err) {
    console.error('[AuditLogger] Kritik hata:', err)
  }
}

function getClientIP(request?: Request): string | undefined {
  if (!request) return undefined
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}
