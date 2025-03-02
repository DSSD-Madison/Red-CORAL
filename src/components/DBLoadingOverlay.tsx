import { useDB } from '@/context/DBContext'

const DBLoadingOverlay = () => {
  const { isLoading } = useDB()
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center backdrop-blur-sm transition-opacity`}
      style={{ opacity: isLoading ? '100' : '0' }}
    >
      <div
        className="h-20 w-20 animate-spin rounded-full border-8 border-white"
        style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)', borderColor: '#888888' }}
      />
    </div>
  )
}

export default DBLoadingOverlay
