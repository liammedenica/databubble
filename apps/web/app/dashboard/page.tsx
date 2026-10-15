import { createClient } from "@/utils/supabase/server";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <DashboardShell user={user} />;
}
