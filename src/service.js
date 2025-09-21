const BASE_URL = "https://rbbnadgzoneslmzsovmb.supabase.co" 
// "https://lxwkrlfthexhhqlbdrme.supabase.co"; //https://rbbnadgzoneslmzsovmb.supabase.co
const ENDPOINT = `${BASE_URL}/rest/v1/attendees`;
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYm5hZGd6b25lc2xtenNvdm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTU5MzgsImV4cCI6MjA3Mzg3MTkzOH0.k1fOMJ3HcNFf37BS_lsTV3KCs29WLbropXYwRcznPts"


function buildHeaders(extra = {}) {
  return {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function parseResponse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.message || data?.error || res.statusText);
  }
  return data;
}

/**
 * Get attendee by UUID
 */
export async function getById(id, { signal } = {}) {
  if (!id) throw new Error("getById: id is required");
  const url = `${ENDPOINT}?id=eq.${encodeURIComponent(id)}&select=*`;
  const res = await fetch(url, { headers: buildHeaders(), signal });
  const data = await parseResponse(res);
  return Array.isArray(data) && data.length ? data[0] : null;
}

/**
 * Get attendee(s) by phone number
 */
export async function getByPhone(phone, { signal } = {}) {
  if (!phone) throw new Error("getByPhone: phone is required");
  const url = `${ENDPOINT}?mobile=eq.${encodeURIComponent(phone)}&select=*`;
  const res = await fetch(url, { headers: buildHeaders(), signal });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data : [];
}

/**
 * Update attendee by UUID (PATCH)
 */
export async function updateById(id, patchObj, { signal } = {}) {
  if (!id) throw new Error("updateById: id is required");
  const url = `${ENDPOINT}?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: buildHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(patchObj),
    signal,
  });
  const data = await parseResponse(res);
  return Array.isArray(data) && data.length ? data[0] : null;
}

export default {
  getById,
  getByPhone,
  updateById,
};
