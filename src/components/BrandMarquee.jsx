export default function BrandMarquee() {
  const items = [
    'WHOLESALE ONLY',
    '1KG & 5KG PACKS',
    'FSSAI CERTIFIED',
    'GST INVOICES',
    'TRANSPORT DISPATCH',
    'MADE IN KOLHAPUR',
    'SINCE 2006',
    'WESTERN MAHARASHTRA DISPATCH',
  ];

  return (
    <div className="brand-marquee-v2">
      <div className="marquee-v2-track">
        {[1, 2, 3].map((i) => (
          <div key={i} className="marquee-v2-group">
            {items.map((item, idx) => (
              <span key={idx} className="marquee-v2-item">
                <span className="marquee-v2-text">{item}</span>
                <span className="marquee-v2-sep" aria-hidden="true"></span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
