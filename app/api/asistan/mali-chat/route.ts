// app/api/asistan/mali-chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildMaliSystemPrompt } from '@/lib/mali/maliPersonaEngine';
import { AddressableUser } from '@/lib/address';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, maliSessionId, musteriId, sessionId } = body;

  // Load musavir profile
  const musavir = await getMusavirProfile(sessionId);

  // Load mali_preferences
  let prefs: Partial<MaliPreferences> | null = await loadMaliPreferences(musavir.id);

  // Load/create mali_sessions
  const session = await loadOrCreateSession(maliSessionId, musteriId, musavir.id);

  // Build system prompt
  const systemPrompt = buildMaliSystemPrompt(prefs, session.active_context, musavir);

  // Call Claude
  const response = await callClaude(systemPrompt + message);
  const { speech, action, proactiveWarning } = parseResponse(response);

  // Execute mali action if any
  if (action) {
    await executeMaliAction(action, session.id, message, response);
  }

  // Update mali_sessions
  await updateSession(session.id, message, response.speech);

  // Log mali_actions
  await logAction(session.id, message, response);

  // Update sessions_completed
  if (action) {
    prefs.sessionsCompleted = (prefs.sessionsCompleted || 0) + 1;
    await updatePreferences(musavir.id, prefs);
  }

  return NextResponse.json({ success: true, data: { speech, proactiveWarning, action, maliSessionId } });
}

async function getMusavirProfile(sessionId: string): Promise<AddressableUser> {
  // Implement logic to load musavir profile from users table
}

async function loadMaliPreferences(musavirId: string): Promise<Partial<MaliPreferences>> {
  const res = await pool.query('SELECT * FROM mali_preferences WHERE musavir_id = $1', [musavirId]);
  return res.rows[0] || {};
}

async function loadOrCreateSession(maliSessionId: string, musteriId: string, musavirId: string): Promise<any> {
  if (maliSessionId) {
    const res = await pool.query('SELECT * FROM mali_sessions WHERE id = $1', [maliSessionId]);
    return res.rows[0];
  } else {
    const sessionId = uuidv4();
    await pool.query('INSERT INTO mali_sessions (id, musavir_id, musteri_id) VALUES ($1, $2, $3)', [sessionId, musavirId, musteriId]);
    return { id: sessionId, active_context: {} };
  }
}

async function callClaude(systemPrompt: string): Promise<string> {
  // Implement logic to call Claude and get response
}

function parseResponse(response: string): any {
  // Implement logic to parse JSON response from Claude
}

async function executeMaliAction(action: any, sessionId: string, message: string, aiResponse: string) {
  // Implement logic to execute mali action based on action type
}

async function updateSession(sessionId: string, message: string, speech: string) {
  await pool.query('UPDATE mali_sessions SET messages = array_append(messages, $1), updated_at = NOW() WHERE id = $2', [message, sessionId]);
}

async function logAction(sessionId: string, message: string, response: any) {
  const actionData = JSON.stringify(response.action);
  await pool.query('INSERT INTO mali_actions (mali_session_id, action_type, input_text, ai_response, action_data) VALUES ($1, $2, $3, $4, $5)', [sessionId, response.action.type, message, response.speech, actionData]);
}

async function updatePreferences(musavirId: string, prefs: Partial<MaliPreferences>) {
  await pool.query('UPDATE mali_preferences SET preferred_mevzuat = $1, correction_history = $2, note_style = $3, preferred_hizmetler = $4, sessions_completed = $5, updated_at = NOW() WHERE musavir_id = $6', [prefs.preferredMevzuat, prefs.correctionHistory, prefs.noteStyle, prefs.preferredHizmetler, prefs.sessionsCompleted, musavirId]);
}

// app/api/asistan/mali-chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildMaliSystemPrompt } from '@/lib/mali/maliPersonaEngine';
import { AddressableUser } from '@/lib/address';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, maliSessionId, musteriId, sessionId } = body;

  // Load musavir profile
  const musavir = await getMusavirProfile(sessionId);

  // Load mali_preferences
  let prefs: Partial<MaliPreferences> | null = await loadMaliPreferences(musavir.id);

  // Load/create mali_sessions
  const session = await loadOrCreateSession(maliSessionId, musteriId, musavir.id);

  // Build system prompt
  const systemPrompt = buildMaliSystemPrompt(prefs, session.active_context, musavir);

  // Call Claude
  const response = await callClaude(systemPrompt + message);
  const { speech, action, proactiveWarning } = parseResponse(response);

  // Execute mali action if any
  if (action) {
    await executeMaliAction(action, session.id, message, response);
  }

  // Update mali_sessions
  await updateSession(session.id, message, response.speech);

  // Log mali_actions
  await logAction(session.id, message, response);

  // Update sessions_completed
  if (action) {
    prefs.sessionsCompleted = (prefs.sessionsCompleted || 0) + 1;
    await updatePreferences(musavir.id, prefs);
  }

  return NextResponse.json({ success: true, data: { speech, proactiveWarning, action, maliSessionId } });
}

async function getMusavirProfile(sessionId: string): Promise<AddressableUser> {
  // Implement logic to load musavir profile from users table
}

async function loadMaliPreferences(musavirId: string): Promise<Partial<MaliPreferences>> {
  const res = await pool.query('SELECT * FROM mali_preferences WHERE musavir_id = $1', [musavirId]);
  return res.rows[0] || {};
}

async function loadOrCreateSession(maliSessionId: string, musteriId: string, musavirId: string): Promise<any> {
  if (maliSessionId) {
    const res = await pool.query('SELECT * FROM mali_sessions WHERE id = $1', [maliSessionId]);
    return res.rows[0];
  } else {
    const sessionId = uuidv4();
    await pool.query('INSERT INTO mali_sessions (id, musavir_id, musteri_id) VALUES ($1, $2, $3)', [sessionId, musavirId, musteriId]);
    return { id: sessionId, active_context: {} };
  }
}

async function callClaude(systemPrompt: string): Promise<string> {
  // Implement logic to call Claude and get response
}

function parseResponse(response: string): any {
  // Implement logic to parse JSON response from Claude
}

async function executeMaliAction(action: any, sessionId: string, message: string, aiResponse: string) {
  // Implement logic to execute mali action based on action type
}

async function updateSession(sessionId: string, message: string, speech: string) {
  await pool.query('UPDATE mali_sessions SET messages = array_append(messages, $1), updated_at = NOW() WHERE id = $2', [message, sessionId]);
}

async function logAction(sessionId: string, message: string, response: any) {
  const actionData = JSON.stringify(response.action);
  await pool.query('INSERT INTO mali_actions (mali_session_id, action_type, input_text, ai_response, action_data) VALUES ($1, $2, $3, $4, $5)', [sessionId, response.action.type, message, response.speech, actionData]);
}

async function updatePreferences(musavirId: string, prefs: Partial<MaliPreferences>) {
  await pool.query('UPDATE mali_preferences SET preferred_mevzuat = $1, correction_history = $2, note_style = $3, preferred_hizmetler = $4, sessions_completed = $5, updated_at = NOW() WHERE musavir_id = $6', [prefs.preferredMevzuat, prefs.correctionHistory, prefs.noteStyle, prefs.preferredHizmetler, prefs.sessionsCompleted, musavirId]);
}

// app/api/asistan/mali-chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildMaliSystemPrompt } from '@/lib/mali/maliPersonaEngine';
import { AddressableUser } from '@/lib/address';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, maliSessionId, musteriId, sessionId } = body;

  // Load musavir profile
  const musavir = await getMusavirProfile(sessionId);

  // Load mali_preferences
  let prefs: Partial<MaliPreferences> | null = await loadMaliPreferences(musavir.id);

  // Load/create mali_sessions
  const session = await loadOrCreateSession(maliSessionId, musteriId, musavir.id);

  // Build system prompt
  const systemPrompt = buildMaliSystemPrompt(prefs, session.active_context, musavir);

  // Call Claude
  const response = await callClaude(systemPrompt + message);
  const { speech, action, proactiveWarning } = parseResponse(response);

  // Execute mali action if any
  if (action) {
    await executeMaliAction(action, session.id, message, response);
  }

  // Update mali_sessions
  await updateSession(session.id, message, response.speech);

  // Log mali_actions
  await logAction(session.id, message, response);

  // Update sessions_completed
  if (action) {
    prefs.sessionsCompleted = (prefs.sessionsCompleted || 0) + 1;
    await updatePreferences(musavir.id, prefs);
  }

  return NextResponse.json({ success: true, data: { speech, proactiveWarning, action, maliSessionId } });
}

async function getMusavirProfile(sessionId: string): Promise<AddressableUser> {
  // Implement logic to load musavir profile from users table
}

async function loadMaliPreferences(musavirId: string): Promise<Partial<MaliPreferences>> {
  const res = await pool.query('SELECT * FROM mali_preferences WHERE musavir_id = $1', [musavirId]);
  return res.rows[0] || {};
}

async function loadOrCreateSession(maliSessionId: string, musteriId: string, musavirId: string): Promise<any> {
  if (maliSessionId) {
    const res = await pool.query('SELECT * FROM mali_sessions WHERE id = $1', [maliSessionId]);
    return res.rows[0];
  } else {
    const sessionId = uuidv4();
    await pool.query('INSERT INTO mali_sessions (id, musavir_id, musteri_id) VALUES ($1, $2, $3)', [sessionId, musavirId, musteriId]);
    return { id: sessionId, active_context: {} };
  }
}

async function callClaude(systemPrompt: string): Promise<string> {
  // Implement logic to call Claude and get response
}

function parseResponse(response: string): any {
  // Implement logic to parse JSON response from Claude
}

async function executeMaliAction(action: any, sessionId: string, message: string, aiResponse: string) {
  // Implement logic to execute mali action based on action type
}

async function updateSession(sessionId: string, message: string, speech: string) {
  await pool.query('UPDATE mali_sessions SET messages = array_append(messages, $1), updated_at = NOW() WHERE id = $2', [message, sessionId]);
}

async function logAction(sessionId: string, message: string, response: any) {
  const actionData = JSON.stringify(response.action);
  await pool.query('INSERT INTO mali_actions (mali_session_id, action_type, input_text, ai_response, action_data) VALUES ($1, $2, $3, $4, $5)', [sessionId, response.action.type, message, response.speech, actionData]);
}

async function updatePreferences(musavirId: string, prefs: Partial<MaliPreferences>) {
  await pool.query('UPDATE mali_preferences SET preferred_mevzuat = $1, correction_history = $2, note_style = $3, preferred_hizmetler = $4, sessions_completed = $5, updated_at = NOW() WHERE musavir_id = $6', [prefs.preferredMevzuat, prefs.correctionHistory, prefs.noteStyle, prefs.preferredHizmetler, prefs.sessionsCompleted, musavirId]);
}