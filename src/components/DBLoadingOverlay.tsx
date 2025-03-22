import { useDB } from '@/context/DBContext'
import { useEffect, useState } from 'react'

const DBLoadingOverlay = () => {
  const { isLoading } = useDB()
  const [shouldRender, setShouldRender] = useState(isLoading)

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!shouldRender) return null
  return (
    <div
      className={`${isLoading ? 'backdrop-blur-sm backdrop-brightness-150 backdrop-grayscale' : 'backdrop-blur-0 backdrop-brightness-100 backdrop-grayscale-0'} absolute inset-0 z-[1000] flex items-center justify-center transition duration-500`}
    >
      <div className={`loader ${isLoading ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
    </div>
  )
}

export default DBLoadingOverlay
