const LoadingOverlay = ({ isVisible, color }: { isVisible: boolean; color?: string }) => (
  <div
    className={`pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center backdrop-blur-sm transition-opacity`}
    style={{ opacity: isVisible ? '100' : '0' }}
  >
    <div
      className="h-20 w-20 animate-spin rounded-full border-8 border-white"
      style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)', borderColor: color }}
    />
  </div>
)

export default LoadingOverlay
