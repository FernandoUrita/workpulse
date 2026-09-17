import SkeletonStats from './SkeletonStats.jsx';
import SkeletonCard from './SkeletonCard.jsx';

export default function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true">
        <SkeletonStats />
        <div className="page-skeleton-cards"><SkeletonCard /><SkeletonCard /></div>
      </div>
    </div>
  );
}
