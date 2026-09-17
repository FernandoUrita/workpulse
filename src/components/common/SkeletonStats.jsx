export default function SkeletonStats({ count = 4 }) {
  return (
    <div className="skeleton-stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat">
          <div className="skeleton skeleton-stat-icon"></div>
          <div className="skeleton-stat-content">
            <div className="skeleton skeleton-line" style={{ width: '40%', height: '20px' }}></div>
            <div className="skeleton skeleton-line narrow"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
