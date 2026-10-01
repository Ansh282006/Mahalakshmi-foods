export default function TrackOrderSkeleton() {
  return (
    <div className="track-skeleton">
      {/* Card 1 */}
      <div className="track-skeleton-card">
        {/* Header */}
        <div className="ts-header">
          <div className="ts-left">
            <div className="shimmer ts-code"></div>
            <div className="shimmer ts-date"></div>
          </div>
          <div className="shimmer ts-badge"></div>
        </div>

        {/* Timeline */}
        <div className="ts-timeline">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ts-step">
              <div className="shimmer ts-circle"></div>
              <div className="shimmer ts-label"></div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="ts-details">
          <div className="ts-detail">
            <div className="shimmer ts-detail-label"></div>
            <div className="shimmer ts-detail-value"></div>
          </div>
          <div className="ts-detail">
            <div className="shimmer ts-detail-label"></div>
            <div className="shimmer ts-detail-value"></div>
          </div>
          <div className="ts-detail">
            <div className="shimmer ts-detail-label"></div>
            <div className="shimmer ts-detail-value"></div>
          </div>
          <div className="ts-detail full">
            <div className="shimmer ts-detail-label"></div>
            <div className="shimmer ts-detail-value wide"></div>
          </div>
        </div>

        {/* History */}
        <div className="ts-history">
          <div className="shimmer ts-history-title"></div>
          <div className="shimmer ts-history-line"></div>
          <div className="shimmer ts-history-line short"></div>
        </div>
      </div>
    </div>
  );
}
