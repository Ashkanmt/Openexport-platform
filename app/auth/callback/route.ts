import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This is where the link in the real confirmation email points.
// Supabase appends a one-time code; exchanging it here is what
// actually activates the account and starts a real session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/chat`);
}
