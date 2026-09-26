// ============================================
// SEO Utilities — Meta tags, structured data
// ============================================

const SITE_URL = 'https://mahalakshmi-foods.vercel.app'; // update after deploy
const BRAND = 'Mahalaxmi Krushi Prakriya Udyog';
const PHONE = '+917774982725';
const ADDRESS = {
  street: 'A/p. Gavase, Tal. Ajara',
  city: 'Kolhapur',
  region: 'Maharashtra',
  postal: '416505',
  country: 'IN',
};

// Update <title> and <meta>
export function setMeta({ title, description, image, url }) {
  document.title = title || `${BRAND} — Authentic Kolhapuri Chips`;

  const setMetaTag = (name, content, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let tag = document.querySelector(`meta[${attr}="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  if (description) {
    setMetaTag('description', description);
    setMetaTag('og:description', description, true);
    setMetaTag('twitter:description', description);
  }

  setMetaTag('og:title', title, true);
  setMetaTag('twitter:title', title);
  setMetaTag('og:type', 'website', true);
  setMetaTag('og:url', url || SITE_URL, true);

  if (image) {
    setMetaTag('og:image', image, true);
    setMetaTag('twitter:image', image);
    setMetaTag('twitter:card', 'summary_large_image');
  }
}

// Inject or update JSON-LD structured data
export function setStructuredData(data) {
  let script = document.getElementById('structured-data');
  if (!script) {
    script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

// Organization schema (for all pages)
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    telephone: PHONE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.region,
      postalCode: ADDRESS.postal,
      addressCountry: ADDRESS.country,
    },
    sameAs: [`https://wa.me/917774982725`],
  };
}

// Product schema (for products page)
export function productSchema(products) {
  return products.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.image_url,
    description: p.description || `${p.name} — ${p.weight}`,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products`,
      priceCurrency: 'INR',
      price: p.price,
      availability:
        p.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  }));
}