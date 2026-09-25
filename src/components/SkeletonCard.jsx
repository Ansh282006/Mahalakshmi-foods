export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image shimmer"></div>
      <div className="skeleton-info">
        <div className="skeleton-line shimmer" style={{ width: '80%', height: '18px' }}></div>
        <div className="skeleton-line shimmer" style={{ width: '45%', height: '14px' }}></div>
        <div className="skeleton-line shimmer" style={{ width: '60%', height: '20px', marginTop: 'auto' }}></div>
        <div className="skeleton-button shimmer"></div>
      </div>
    </div>
  );
}