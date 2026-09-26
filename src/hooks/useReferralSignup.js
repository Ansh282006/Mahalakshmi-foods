import { supabase } from '../supabaseClient';

// Called during signup — credits the referrer with bonus
export async function processReferral(code, newUserId, newUserEmail) {
  if (!code) return;

  // Find referrer
  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('user_id')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (!refCode) return;

  const referrerId = refCode.user_id;

  // Log the referral
  await supabase.from('referrals').insert({
    referrer_id: referrerId,
    referee_id: newUserId,
    referee_email: newUserEmail,
    reward_points: 500,
    status: 'completed',
  });

  // Give both users 500 loyalty points (₹50 worth)
  await supabase.from('loyalty_points').insert([
    {
      user_id: referrerId,
      points: 500,
      type: 'earned',
      source: 'referral',
      description: `Referral bonus — friend ${newUserEmail} signed up`,
    },
    {
      user_id: newUserId,
      points: 500,
      type: 'earned',
      source: 'referral',
      description: `Welcome bonus — referred by a friend`,
    },
  ]);
}