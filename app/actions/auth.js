'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(_prev, formData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (error) return { error: error.message };
  redirect('/');
}

export async function signup(_prev, formData) {
  const supabase = await createClient();
  const email = formData.get('email');
  const { data, error } = await supabase.auth.signUp({
    email,
    password: formData.get('password'),
  });
  if (error) return { error: error.message };

  // With "Confirm email" enabled in Supabase, signUp succeeds but hands back no
  // session. Redirecting to a gated route here would bounce straight back to
  // /login and look like the button did nothing, so say what actually happened.
  if (!data.session) return { checkEmail: email };

  // New account has no shop yet -> onboarding builds one.
  redirect('/onboarding');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
