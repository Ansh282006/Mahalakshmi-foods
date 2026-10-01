import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const SEEN_KEY = 'mahalaxmi_admin_seen_at';

export default function usePendingOrders() {
  const { user, isAdmin } = useAuth();
  const [pending, setPending] = useState(0);
  const [unseen, setUnseen] = useState(0);

  useEffect(() => {
    if (!user || !isAdmin) return;

    async function fetchPending() {
      const { data } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('status', 'Pending');

      if (!data) return;

      const lastSeen = localStorage.getItem(SEEN_KEY);
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

      setPending(data.length);

      const unseenCount = data.filter(
        (o) => new Date(o.created_at).getTime() > lastSeenTime
      ).length;
      setUnseen(unseenCount);
    }

    fetchPending();
    const interval = setInterval(fetchPending, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const markAsSeen = () => {
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
    setUnseen(0);
  };

  return { pending, unseen, markAsSeen };
}
