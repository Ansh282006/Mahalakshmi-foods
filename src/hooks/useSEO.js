import { useEffect } from 'react';
import { setMeta, setStructuredData, organizationSchema } from '../utils/seo';

export default function useSEO({ title, description, image, structuredData } = {}) {
  useEffect(() => {
    setMeta({ title, description, image });
    const data = structuredData || organizationSchema();
    setStructuredData(data);
  }, [title, description, image, structuredData]);
}