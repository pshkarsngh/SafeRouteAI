import { Routes, Route } from 'react-router-dom'
import Intro from './sections/Intro'
import Search from './pages/Search'
import Projects from './pages/Projects'
import Navbar from './components/Navigation/Navbar'
import FullScreenNav from './components/Navigation/FullScreenNav'

const App = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <FullScreenNav />
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/search" element={<Search />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </div>
  )
}

export default App
