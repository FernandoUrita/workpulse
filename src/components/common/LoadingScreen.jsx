export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <i className="fas fa-heartbeat"></i>
        <h2>Work<span>Pulse</span></h2>
      </div>
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading your workspace...</p>
    </div>
  );
}
