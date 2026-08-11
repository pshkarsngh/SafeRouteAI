import { Routes, Route } from 'react-router-dom'
import Intro from './sections/Intro'
import Search from './pages/Search'
import Projects from './pages/Projects'
import Navbar from './components/Navigation/Navbar'
import SideMenu from './components/SideMenu'

const App = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <SideMenu />
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/search" element={<Search />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </div>
  )
}

export default App
