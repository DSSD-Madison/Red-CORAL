import { useDB } from '@/context/DBContext'
import { signOut } from 'firebase/auth'
import { Link, useLocation } from 'react-router'
import React, { useState, useRef } from 'react'
import { LucideBarChart3, LucideExternalLink, LucideMap, LucideUser, LucideChevronDown, LucideMenu, LucideX } from 'lucide-react'
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

const ExternalLink = ({ href, text, onClick }: { href: string; text: string; onClick?: () => void }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-black/80 transition hover:border-gray-400 hover:bg-gray-200 hover:text-black"
  >
    {text}
    <LucideExternalLink height={12} width={12} />
  </a>
)

const NavLink = ({
  to,
  icon,
  text,
  isActive,
  onClick,
}: {
  to: string
  icon?: React.ReactNode
  text: string
  isActive: boolean
  onClick?: () => void
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${isActive ? 'border-blue-600 bg-blue-100 text-blue-600 shadow-md' : 'text-black/80 hover:border-gray-400 hover:bg-gray-200 hover:text-black'}`}
  >
    {icon}
    {text}
  </Link>
)

const MobileNavLink = ({
  to,
  icon,
  text,
  isActive,
  onClick,
}: {
  to: string
  icon?: React.ReactNode
  text: string
  isActive: boolean
  onClick?: () => void
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 text-sm transition ${isActive ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
  >
    {icon}
    {text}
  </Link>
)

const MobileExternalLink = ({ href, text, onClick }: { href: string; text: string; onClick?: () => void }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
  >
    {text}
    <LucideExternalLink height={14} width={14} />
  </a>
)

const Navigation = () => {
  const { isLoggedIn, isAdmin, auth } = useDB()
  const { pathname } = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const closeMobileMenu = () => {
    mobileMenuRef.current?.hidePopover()
  }

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

      {/* Desktop Navigation */}
      <div className="hidden md:flex md:flex-1 md:items-center md:gap-1">
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
        <NavLink to="/about" text="Acerca de" isActive={pathname === '/about'} />
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
          <NavLink to="/login" text="Registrarse" icon={<LucideUser height={16} width={16} />} isActive={pathname === '/login'} />
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex flex-1 justify-end md:hidden">
        <button
          // @ts-expect-error - popoverTarget is valid HTML but not yet in React types
          popovertarget="mobile-nav-menu"
          className="flex items-center justify-center rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
          aria-label="Abrir menú"
        >
          <LucideMenu height={24} width={24} />
        </button>
      </div>

      {/* Mobile Slide-over Menu */}
      <div
        ref={mobileMenuRef}
        popover="auto"
        id="mobile-nav-menu"
        className="fixed inset-0 m-0 h-screen w-[280px] max-w-[80vw] translate-x-[-100vw] border-r border-gray-300 bg-white p-0 shadow-xl transition-transform duration-300 ease-out [&:popover-open]:translate-x-0"
      >
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
          <Link to="/" onClick={closeMobileMenu}>
            <img src="/wordmark.png" alt="Red Coral" className="h-6 w-auto" />
          </Link>
          <button
            // @ts-expect-error - popoverTarget is valid HTML but not yet in React types
            popovertarget="mobile-nav-menu"
            popovertargetaction="hide"
            className="flex items-center justify-center rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
            aria-label="Cerrar menú"
          >
            <LucideX height={20} width={20} />
          </button>
        </div>

        <nav className="flex flex-col py-2">
          <MobileNavLink to="/" text="Mapa" icon={<LucideMap height={18} width={18} />} isActive={pathname === '/'} onClick={closeMobileMenu} />
          <MobileNavLink
            to="/stats"
            text="Estadísticas"
            icon={<LucideBarChart3 height={18} width={18} />}
            isActive={pathname === '/stats'}
            onClick={closeMobileMenu}
          />

          {isAdmin && (
            <>
              <div className="my-2 border-t border-gray-200" />
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Admin</p>
              <MobileNavLink to="/admin/dash" text="Administrar categorías" isActive={pathname === '/admin/dash'} onClick={closeMobileMenu} />
              <MobileNavLink to="/admin/publish" text="Publicar Datos" isActive={pathname === '/admin/publish'} onClick={closeMobileMenu} />
              <MobileNavLink to="/admin/analytics" text="Analítica web" isActive={pathname === '/admin/analytics'} onClick={closeMobileMenu} />
            </>
          )}

          <div className="my-2 border-t border-gray-200" />
          <MobileExternalLink href="https://redcoralmap.org/guia-metodologia" text="Guía de Metodología" onClick={closeMobileMenu} />
          <MobileNavLink to="/about" text="Acerca de" isActive={pathname === '/about'} onClick={closeMobileMenu} />

          <div className="my-2 border-t border-gray-200" />
          {isLoggedIn ? (
            <>
              <div className="px-4 py-2">
                <p className="truncate text-xs text-gray-500">{auth.currentUser?.email}</p>
              </div>
              <button
                onClick={() => {
                  signOut(auth)
                  closeMobileMenu()
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <MobileNavLink
              to="/login"
              text="Registrarse"
              icon={<LucideUser height={18} width={18} />}
              isActive={pathname === '/login'}
              onClick={closeMobileMenu}
            />
          )}
        </nav>
      </div>
    </div>
  )
}

export default Navigation
