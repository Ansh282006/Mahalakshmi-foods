export default function StarRating({ value = 0, size = '1rem', showNumber = false, total = 0 }) {
  const stars = [1, 2, 3, 4, 5];
  const rounded = Math.round(value);

  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= rounded ? 'filled' : 'empty'}`}
        >
          ★
        </span>
      ))}
      {showNumber && (
        <span className="star-number">
          {value > 0 ? value.toFixed(1) : 'New'}
          {total > 0 && <span className="star-total"> ({total})</span>}
        </span>
      )}
    </div>
  );
}