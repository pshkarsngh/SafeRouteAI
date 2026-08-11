import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export type NavbarContextType = [boolean, React.Dispatch<React.SetStateAction<boolean>>]
export type NavbarColorContextType = [string, React.Dispatch<React.SetStateAction<string>>]

export const NavbarContext = createContext<NavbarContextType | undefined>(undefined)
export const NavbarColorContext = createContext<NavbarColorContextType | undefined>(undefined)

const NavContext = ({ children }: { children: ReactNode }) => {
  const [navColor, setNavColor] = useState('white')

  const [navOpen, setNavOpen] = useState(false)

  const locate = useLocation().pathname
  useEffect(
    function () {
      if (locate == '/projects' || locate == '/search') {
        setNavColor('black')
      } else {
        setNavColor('white')
      }
    },
    [locate],
  )

  return (
    <div>
      <NavbarContext.Provider value={[navOpen, setNavOpen]}>
        <NavbarColorContext.Provider value={[navColor, setNavColor]}>
          {children}
        </NavbarColorContext.Provider>
      </NavbarContext.Provider>
    </div>
  )
}

export default NavContext
