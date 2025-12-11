/**
 * Shared response utilities for Edge Functions
 * P2: Shared code layout & import discipline
 */

import { corsHeaders } from './cors.ts';

export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  });
}

export function errorResponse(message: string, status = 500, details?: any): Response {
  return jsonResponse(
    { error: message, ...(details && { details }) },
    status
  );
}

export function successResponse(data: any): Response {
  return jsonResponse({ success: true, ...data });
}
