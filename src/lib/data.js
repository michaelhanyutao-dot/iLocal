import { supabase, hasSupabaseConfig } from "./supabase";
import { demoEvents, demoItems, demoVenues } from "./demoData";

function byUpdated(a, b) {
  return new Date(b.updated_at || b.starts_at || 0) - new Date(a.updated_at || a.starts_at || 0);
}

function activeUpcoming(row) {
  if (row.status !== "active") return false;
  if (row.content_kind === "event" && row.ends_at && new Date(row.ends_at) < new Date()) return false;
  return true;
}

export async function getExploreItems() {
  if (!hasSupabaseConfig) return { items: demoItems, demo: true };
  const [venues, events] = await Promise.all([
    supabase.from("venues").select("*").eq("status", "active").order("updated_at", { ascending: false }),
    supabase.from("events").select("*").eq("status", "active").or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`).order("starts_at", { ascending: true }),
  ]);
  if (venues.error || events.error) {
    console.warn("Supabase read failed; using demo data", venues.error || events.error);
    return { items: demoItems, demo: true };
  }
  return {
    items: [
      ...(events.data || []).map((event) => ({ ...event, content_kind: "event" })),
      ...(venues.data || []).map((venue) => ({ ...venue, content_kind: "venue" })),
    ].filter(activeUpcoming),
    demo: false,
  };
}

export async function getAdminContent() {
  if (!hasSupabaseConfig) {
    return { venues: demoVenues.sort(byUpdated), events: demoEvents.sort(byUpdated), demo: true };
  }
  const [venues, events] = await Promise.all([
    supabase.from("venues").select("*").order("updated_at", { ascending: false }),
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
  ]);
  if (venues.error || events.error) throw venues.error || events.error;
  return { venues: venues.data || [], events: events.data || [], demo: false };
}

export async function bulkInsert(kind, rows) {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_PUBLISHABLE_KEY first.");
  }
  const table = kind === "event" ? "events" : "venues";
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw error;
  return data;
}

export async function track(action_name, properties = {}) {
  if (!hasSupabaseConfig) return;
  await supabase.from("user_actions").insert({
    action_name,
    properties,
    platform: "web",
    anonymous_id: getAnonymousId(),
  });
}

function getAnonymousId() {
  let id = localStorage.getItem("ilocal_anonymous_id");
  if (!id) {
    id = `anon_${crypto.randomUUID()}`;
    localStorage.setItem("ilocal_anonymous_id", id);
  }
  return id;
}
