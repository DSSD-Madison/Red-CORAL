import { useDB } from '@/context/DBContext'
import { signOut } from 'firebase/auth'
import { Link, useLocation } from 'react-router'
import React, { useState } from 'react'
import { LucideBarChart3, LucideExternalLink, LucideMap, LucideUser, LucideChevronDown } from 'lucide-react'
import {
  useFloating,
  offset,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  useTransitionStyles,
} from '@floating-ui/react'

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

const NavLink = ({ to, icon, text, isActive }: { to: string; icon?: React.ReactNode; text: string; isActive: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${isActive ? 'border-blue-600 bg-blue-100 text-blue-600 shadow-md' : 'text-black/80 hover:border-gray-400 hover:bg-gray-200 hover:text-black'}`}
  >
    {icon}
    {text}
  </Link>
)

const Navigation = () => {
  const { isLoggedIn, isAdmin, auth } = useDB()
  const { pathname } = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isDropdownOpen,
    onOpenChange: setIsDropdownOpen,
    placement: 'bottom-end',
    middleware: [offset(5), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  })

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    initial: {
      transform: 'scale(0.95)',
      opacity: 0,
    },
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  return (
    <div className="fixed top-0 z-[10000] flex h-12 w-full items-center gap-1 border-b-2 border-gray-400 bg-white px-2 text-xs leading-none">
      <Link to="/">
        <img src="/wordmark.png" alt="Red Coral" className="h-6 w-auto pr-4" />
      </Link>
      <NavLink to="/" text="Mapa" icon={<LucideMap height={15} width={15} />} isActive={pathname === '/'} />
      <NavLink to="/stats" text="Estadísticas" icon={<LucideBarChart3 height={15} width={15} />} isActive={pathname === '/stats'} />
      {isAdmin && (
        <>
          <div className="mx-3 h-3 border-l-2 border-gray-400" />
          <NavLink to="/admin/dash" text="Administrar categorías" isActive={pathname === '/admin/dash'} />
          <NavLink to="/admin/publish" text="Publicar Datos" isActive={pathname === '/admin/publish'} />
          <NavLink to="/admin/analytics" text="Analítica web" isActive={pathname === '/admin/analytics'} />
        </>
      )}
      <div className="flex-grow" />
      <ExternalLink href="https://redcoralmap.org/guia-metodologia" text="Guía de Metodología" />
      {isAdmin && <NavLink to="/about" text="Acerca de" isActive={pathname === '/about'} />}
      {isLoggedIn ? (
        <>
          <button
            ref={refs.setReference}
            {...getReferenceProps()}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${isDropdownOpen ? 'border-blue-600 bg-blue-100 text-blue-600 shadow-md' : 'text-black/80 hover:border-gray-400 hover:bg-gray-200 hover:text-black'}`}
          >
            <LucideUser height={16} width={16} />
            Cuenta
            <LucideChevronDown height={14} width={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMounted && (
            <FloatingFocusManager context={context} modal={false}>
              <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                <div style={transitionStyles}>
                  <div className="min-w-[200px] rounded-lg border border-gray-400 bg-white shadow-lg">
                    <div className="border-b border-gray-200 px-4 py-2">
                      <p className="truncate text-xs text-gray-600">{auth.currentUser?.email}</p>
                    </div>
                    <ul className="py-1">
                      <li>
                        <button
                          onClick={() => {
                            signOut(auth)
                            setIsDropdownOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Cerrar sesión
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </FloatingFocusManager>
          )}
        </>
      ) : (
        <>
          <NavLink to="/login" text="Registrarse" icon={<LucideUser height={16} width={16} />} isActive={pathname === '/login'} />
        </>
      )}
    </div>
  )
}

export default Navigation
