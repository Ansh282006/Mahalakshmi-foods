import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

let cache = null;

export default function useCompanyInfo() {
  const [company, setCompany] = useState(cache);

  useEffect(() => {
    if (cache) return;
    async function fetchCompany() {
      const { data } = await supabase
        .from('company_info')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      cache = data;
      setCompany(data);
    }
    fetchCompany();
  }, []);

  return company;
}