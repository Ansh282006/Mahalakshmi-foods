export default function BrandMarquee() {
  const items = [
    { text: 'महालक्ष्मी कृषी प्रक्रिया उद्योग', highlight: false },
    { text: '★', highlight: true },
    { text: '100% Natural Ingredients', highlight: false },
    { text: '★', highlight: true },
    { text: 'Freshly Fried Chips', highlight: false },
    { text: '★', highlight: true },
    { text: 'FSSAI Certified', highlight: false },
    { text: '★', highlight: true },
    { text: 'Made with Love in Kolhapur', highlight: false },
    { text: '★', highlight: true },
  ];

  return (
    <div className="brand-marquee">
      <div className="marquee-track">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className={`marquee-item ${item.highlight ? 'marquee-star' : ''}`}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}