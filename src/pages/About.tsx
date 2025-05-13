import { useDB } from '@/context/DBContext'
import { formatDuration } from '@/utils'
import React from 'react'

const About: React.FC = () => {
  const { db, isLoggedIn } = useDB()
  const url = import.meta.env.VITE_REPOSITORY_URL
  const commitHash = import.meta.env.VITE_APP_VERSION
  const commitDate = import.meta.env.VITE_BUILD_TIMESTAMP || Date.now() - 10
  const date = new Date(Number(commitDate))
  const appDiffString = formatDuration(date.getTime())
  const dbDiffString = formatDuration(isLoggedIn ? Date.now() : Date.parse(db.readAt || '') || Date.now())
  const commitUrl = url && commitHash ? `${url}/commit/${commitHash}` : ''
  const urlElement = commitUrl ? (
    <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-500 hover:underline">
      {commitHash}
    </a>
  ) : (
    <span className="font-semibold">{commitHash || 'N/A'}</span>
  )

  return (
    <div className="flex min-h-full flex-col gap-2 bg-slate-200 p-4">
      <div className="flex flex-row items-center gap-2">
        <h1 className="self-start text-2xl font-semibold">Acerca de</h1>
        <div className="flex-grow" />
        <a href="https://madison.dssdglobal.org/" target="_blank" rel="noopener noreferrer">
          <img src="dssd_logo.svg" alt="DSSD logo" height={75} width={75} />
        </a>
        <img src="banner.png" alt="Red CORAL logo" className="w-full max-w-64" />
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <p>Red-CORAL es una plataforma para el seguimiento de incidentes criminales a lo largo del tiempo, con sede en Colombia.</p>
        <p className="mt-4 text-sm text-gray-600">
          Última actualización de la base de datos hace <span className="font-semibold">{dbDiffString}</span>.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Versión: {urlElement}. Compilado hace <span className="font-semibold">{appDiffString}</span>.
        </p>
      </div>
    </div>
  )
}

export default About
