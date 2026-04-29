import { supabase } from './supabase';
import {
  DEMO_EMAIL, DEMO_PASSWORD,
  DEMO_FD_BOOKINGS, DEMO_MF_HOLDINGS, DEMO_GOALS,
} from './demoData';

export const seedDemoAccount = async () => {
  console.log('Seeding demo account...');

  // 1. Create demo user (or get existing)
  let userId: string | undefined;

  const { data: signUpData } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  // Try sign in if already exists
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  userId = signInData?.user?.id || signUpData?.user?.id;
  if (!userId) {
    console.error('Could not get demo user ID');
    return;
  }

  // 2. Clear existing demo data
  await Promise.all([
    supabase.from('fd_bookings').delete().eq('user_id', userId),
    supabase.from('mf_holdings').delete().eq('user_id', userId),
    supabase.from('user_goals').delete().eq('user_id', userId),
  ]);

  // 3. Insert demo FD bookings
  const { error: fdError } = await supabase.from('fd_bookings').insert(
    DEMO_FD_BOOKINGS.map(b => ({ ...b, user_id: userId }))
  );
  if (fdError) console.warn('FD insert warning:', fdError.message);

  // 4. Insert demo MF holdings
  const { error: mfError } = await supabase.from('mf_holdings').insert(
    DEMO_MF_HOLDINGS.map(h => ({ ...h, user_id: userId }))
  );
  if (mfError) console.warn('MF insert warning:', mfError.message);

  // 5. Insert demo goals
  const { error: goalError } = await supabase.from('user_goals').insert(
    DEMO_GOALS.map(g => ({ ...g, user_id: userId }))
  );
  if (goalError) console.warn('Goal insert warning:', goalError.message);

  console.log('Demo account seeded successfully!');
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);

  // Sign out demo user so admin stays logged in
  await supabase.auth.signOut();
};
