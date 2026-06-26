import { createClient } from "@supabase/supabase-js";
import { Property } from "./db";
import { NextRequest } from "next/server";

// Normalize Supabase URL to strip rest/v1 suffixes if present
const originalUrl = process.env.SUPABASE_URL || "https://frswlyctlykrnaorfoql.supabase.co/rest/v1/";
const supabaseUrl = originalUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_jVJImDlEiY82jY_mmj-uOw_rszYR9Wz";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Validates the request's Supabase session using the Authorization Bearer token.
 */
export async function validateSessionUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error("Autenticação inválida:", error?.message);
      return null;
    }
    return user;
  } catch (err) {
    console.error("Erro ao validar sessão do usuário:", err);
    return null;
  }
}

/**
 * Strips HTML tags and trims strings to protect against basic XSS payloads.
 */
export function sanitizeInput(str: any): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s.replace(/<[^>]*>/g, "").trim();
}

export interface SupabaseProperty {
  id?: number;
  name: string;
  municipality: string;
  reference_point: string;
  gps_coordinates: string;
  owner_name: string;
  cpf: string;
  birth_date: string;
  contact_phone: string;
  collaborative_owner: boolean;
  wifi_name: string;
  wifi_pass: string;
  residents: string[];
  photos: string[];
  last_patrol: string;
}

export function toSupabase(prop: Property): Omit<SupabaseProperty, "id"> & { id?: number } {
  return {
    id: prop.id,
    name: prop.name,
    municipality: prop.municipality,
    reference_point: prop.referencePoint || "",
    gps_coordinates: prop.gpsCoordinates || "",
    owner_name: prop.ownerName || "",
    cpf: prop.cpf || "",
    birth_date: prop.birthDate || "",
    contact_phone: prop.contactPhone || "",
    collaborative_owner: !!prop.collaborativeOwner,
    wifi_name: prop.wifiName || "",
    wifi_pass: prop.wifiPass || "",
    residents: prop.residents || [],
    photos: prop.photos || [],
    last_patrol: prop.lastPatrol || "",
  };
}

export function fromSupabase(sProp: SupabaseProperty): Property {
  return {
    id: sProp.id,
    name: sProp.name || "",
    municipality: sProp.municipality || "",
    referencePoint: sProp.reference_point || "",
    gpsCoordinates: sProp.gps_coordinates || "",
    ownerName: sProp.owner_name || "",
    cpf: sProp.cpf || "",
    birthDate: sProp.birth_date || "",
    contactPhone: sProp.contact_phone || "",
    collaborativeOwner: !!sProp.collaborative_owner,
    wifiName: sProp.wifi_name || "",
    wifiPass: sProp.wifi_pass || "",
    residents: sProp.residents || [],
    photos: sProp.photos || [],
    lastPatrol: sProp.last_patrol || "",
  };
}
