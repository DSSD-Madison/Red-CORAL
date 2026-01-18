import { useDB } from '@/context/DBContext'
import { signOut } from 'firebase/auth'
import { Link, useLocation } from 'react-router'
import React from 'react'
import { LucideBarChart3, LucideExternalLink, LucideMap, LucideUser } from 'lucide-react'

const Navigation = () => {
  const { isLoggedIn, auth } = useDB()
  const { pathname } = useLocation()
  const ExternalLink = ({ href, text }: { href: string; text: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-black/80 transition hover:border-gray-400 hover:bg-gray-200 hover:text-black"
    >
      {text}
      <LucideExternalLink height={12} width={12} />
    </a>
  )

  const NavLink = ({ to, icon, text }: { to: string; icon?: React.ReactNode; text: string }) => (
    <Link
      to={to}
      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${pathname === to ? 'border-blue-600 bg-blue-100 text-blue-600 shadow-md' : 'text-black/80 hover:border-gray-400 hover:bg-gray-200 hover:text-black'}`}
    >
      {icon}
      {text}
    </Link>
  )
  return (
    <div className="absolute top-0 z-[1000] flex h-12 w-full items-center gap-1 overflow-x-auto overflow-y-hidden border-b-2 border-gray-400 bg-white px-2 text-xs leading-none">
      <Link to="/">
        <img src="/wordmark.png" alt="Red Coral" className="h-6 w-auto pr-4" />
      </Link>
      <NavLink to="/" text="Mapa" icon={<LucideMap height={16} width={16} />} />
      <NavLink to="/stats" text="Estadísticas" icon={<LucideBarChart3 height={16} width={16} />} />
      {isLoggedIn && (
        <>
          <div className="mx-3 h-3 border-l-2 border-gray-400" />
          <NavLink to="/admin/dash" text="Administrar categorías" />
          <NavLink to="/admin/publish" text="Publicar Datos" />
          <NavLink to="/admin/analytics" text="Analítica web" />
        </>
      )}
      <div className="flex-grow" />
      <ExternalLink href="https://redcoralmap.org/guia-metodologia" text="Guía de Metodología" />
      {isLoggedIn ? (
        <>
          <NavLink to="/about" text="Acerca de" />
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-black/80 transition hover:border-red-400 hover:bg-red-200 hover:text-red-600"
          >
            <LucideUser height={16} width={16} />
            {/* TODO: probably have a whole user menu here */}
            Salir
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login" text="Registrarse" icon={<LucideUser height={16} width={16} />} />
        </>
      )}
    </div>
  )
}

export default Navigation
