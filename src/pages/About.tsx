import React from 'react'

const About: React.FC = () => {
  const url = import.meta.env.VITE_REPOSITORY_URL
  const commitHash = import.meta.env.VITE_APP_VERSION
  const commitUrl = url && commitHash ? `${url}/commit/${commitHash}` : ''
  const urlElement = commitUrl ? (
    <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
      {commitHash}
    </a>
  ) : (
    <span className="text-gray-500">{commitHash || 'N/A'}</span>
  )

  return (
    <div className="flex min-h-full flex-col gap-2 bg-slate-200 p-4">
      <div className="flex flex-row items-start gap-2">
        <h1 className="text-2xl font-semibold">Acerca de</h1>
        <div className="flex-grow" />
        <a href="https://madison.dssdglobal.org/" target="_blank" rel="noopener noreferrer">
          <img src="dssd_logo.svg" alt="DSSD logo" className="aspect-square h-full drop-shadow filter" />
        </a>
        <img src="banner.png" alt="Red CORAL logo" className="w-full max-w-64 drop-shadow filter" />
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <p>Red-CORAL es una plataforma para el seguimiento de incidentes criminales a lo largo del tiempo, con sede en Colombia.</p>
        <p className="mt-4 text-sm text-gray-600">Versión: {urlElement}</p>
      </div>
    </div>
  )
}

export default About
