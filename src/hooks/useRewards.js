import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function useRewards() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function fetchAll() {
    setLoading(true);

    // Referral code
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .maybeSingle();
    if (codeData) setReferralCode(codeData.code);

    // Referrals made
    const { data: refData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
    setReferrals(refData || []);

    // Points balance
    const { data: ptsData } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ptsData) {
      setPointsHistory(ptsData);
      const earned = ptsData
        .filter((p) => p.type === 'earned')
        .reduce((s, p) => s + p.points, 0);
      const redeemed = ptsData
        .filter((p) => p.type === 'redeemed')
        .reduce((s, p) => s + p.points, 0);
      setPoints(earned - redeemed);
    }

    // Wallet
    const { data: walletData } = await supabase
      .from('wallet_credits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_used', false);
    if (walletData) {
      setWalletBalance(walletData.reduce((s, w) => s + Number(w.amount), 0));
    }

    setLoading(false);
  }

  return {
    referralCode,
    referrals,
    points,
    pointsHistory,
    walletBalance,
    loading,
    refresh: fetchAll,
  };
}