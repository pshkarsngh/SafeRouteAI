import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export type NavbarColorContextType = [string, React.Dispatch<React.SetStateAction<string>>]

export const NavbarColorContext = createContext<NavbarColorContextType | undefined>(undefined)

const NavContext = ({ children }: { children: ReactNode }) => {
  const [navColor, setNavColor] = useState('white')

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
      <NavbarColorContext.Provider value={[navColor, setNavColor]}>
        {children}
      </NavbarColorContext.Provider>
    </div>
  )
}

export default NavContext
