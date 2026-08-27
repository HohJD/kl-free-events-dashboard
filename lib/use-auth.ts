"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /** Sign in, or transparently create the account if it doesn't exist. */
  const signInOrUp = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      const { error: upError } = await supabase.auth.signUp({ email, password });
      if (!upError) return { error: null };
      // Wrong password on an existing account also lands here
      if (upError.message.toLowerCase().includes("already registered")) {
        return { error: "Wrong password for this email." };
      }
      return { error: upError.message };
    }
    return { error: error.message };
  };

  const signOut = () => getSupabase().auth.signOut();

  return { user, ready, signInOrUp, signOut };
}
