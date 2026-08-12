import { Routes, Route, useLocation } from 'react-router-dom'
import Intro from './sections/Intro'
import Search from './pages/Search'
import RouteResults from './pages/RouteResults'
import Projects from './pages/Projects'
import Placeholder from './pages/Placeholder'
import Navbar from './components/Navigation/Navbar'
import SideMenu from './components/SideMenu/SideMenu'

const App = () => {
  const { pathname } = useLocation()
  const hideChrome = pathname === '/' || pathname === '/search'
  const hideNavbar = hideChrome || pathname === '/route-results'

  return (
    <div className="overflow-x-hidden">
      {!hideNavbar && <Navbar />}
      {!hideChrome && <SideMenu />}
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/search" element={<Search />} />
        <Route path="/route-results" element={<RouteResults />} />
        <Route path="/projects" element={<Projects />} />
        <Route
          path="/about"
          element={
            <Placeholder
              title="About"
              description="How INDROUTE scores and ranks safer routes for your journey."
            />
          }
        />
        <Route
          path="/services"
          element={
            <Placeholder
              title="Services"
              description="Real-time incident monitoring, hazard detection and safer route planning."
            />
          }
        />
        <Route
          path="/contact"
          element={
            <Placeholder
              title="Contact"
              description="Get in touch with the INDROUTE team."
            />
          }
        />
        <Route
          path="*"
          element={
            <Placeholder
              title="Page not found"
              description="The page you are looking for does not exist."
            />
          }
        />
      </Routes>
    </div>
  )
}

export default App