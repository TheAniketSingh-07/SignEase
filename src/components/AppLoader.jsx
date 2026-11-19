export default function AppLoader({
  label = 'Loading SignEase...',
  fullScreen = true,
}) {
  return (
    <div
      className={`app-loader ${fullScreen ? 'app-loader-full' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="app-loader-spinner"></div>
      <p>{label}</p>
    </div>
  );
}