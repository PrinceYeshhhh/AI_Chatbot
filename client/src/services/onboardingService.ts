import { supabase } from "./supabase";

export async function getUserOnboardingStatus() {
  const { data, error } = await supabase
    .from("user_settings")
    .select("has_completed_onboarding, onboarding_progress")
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserOnboardingStatus(updates: Partial<{ has_completed_onboarding: boolean; onboarding_progress: number }>) {
  const { error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", supabase.auth.user()?.id);
  if (error) throw error;
} 