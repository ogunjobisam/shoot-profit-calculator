import { supabase } from "@/integrations/supabase/client";
import type { Band } from "./truerate";

type EventName = "calculated" | "shared" | "email_captured";

// Fully anonymous: event name + rate band only. Never inputs, never identifiers.
export async function trackEvent(event: EventName, band: Band | null) {
  try {
    await supabase.from("usage_events").insert({ event, band });
  } catch {
    // Analytics must never break the calculator.
  }
}

export async function captureEmail(email: string, source: string | null) {
  const { error } = await supabase.from("email_captures").insert({ email, source });
  if (error) throw error;
}
