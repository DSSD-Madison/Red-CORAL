import { Auth, signOut } from 'firebase/auth'
import { Link, useLocation } from 'react-router-dom'

const Navigation = ({ isLoggedIn, auth }: { isLoggedIn: boolean; auth: Auth }) => {
  const { pathname } = useLocation()
  const NavLink = ({ to, text }: { to: string; text: string }) => (
    <Link to={to} className={pathname === to ? 'font-bold' : ''}>
      {text}
    </Link>
  )
  return (
    <div className="flex h-5 w-full items-center gap-2 border-b-2 border-gray-400 bg-white px-2 text-xs leading-none">
      <NavLink to="/" text="Mapa" />
      <NavLink to="/stats" text="Estadísticas" />
      {isLoggedIn && (
        <>
          <div className="h-3 border-l-2 border-gray-400" />
          <NavLink to="/admin/dash" text="Administrar categorías" />
          <a href="https://net.tsuni.dev/redcoralmap.web.app" target="_blank" rel="noopener noreferrer">
            Analítica web
          </a>
        </>
      )}
      <div className="flex-grow" />
      {isLoggedIn ? (
        <button onClick={() => signOut(auth)} className="inline">
          Salir
        </button>
      ) : (
        <Link to="/login">Registrarse</Link>
      )}
    </div>
  )
}

export default Navigation
