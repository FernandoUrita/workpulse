export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="skeleton skeleton-stat-icon"></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton skeleton-line title"></div>
          <div className="skeleton skeleton-line narrow"></div>
        </div>
      </div>
      <div className="skeleton skeleton-line wide"></div>
      <div className="skeleton skeleton-line medium"></div>
    </div>
  );
}
