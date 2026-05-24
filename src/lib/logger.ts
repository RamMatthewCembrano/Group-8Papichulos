import { supabase } from "./supabase";

/**
 * Logs an action performed by an admin in the admin panel.
 * @param action - A short description of the action (e.g., "Updated Order Status", "Deleted Menu Item")
 * @param details - Optional details about the action (e.g., "Order ID: 123 to 'completed'")
 */
export async function logAdminAction(action: string, details?: string) {
  try {
    // Attempt to get the current authenticated user's email
    const { data: { session } } = await supabase.auth.getSession();
    const admin_email = session?.user?.email || "Unknown Admin";

    const { error } = await supabase.from("admin_logs").insert([
      {
        action,
        details: details || null,
        admin_email,
      },
    ]);

    if (error) {
      console.error("Failed to log admin action:", error);
    }
  } catch (err) {
    console.error("Error logging admin action:", err);
  }
}
