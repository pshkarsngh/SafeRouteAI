import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import NavContext from './context/NavContext.tsx'
import { PreloaderProvider } from './components/preloader'
import { PageLoaderProvider } from './components/pageLoader'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NavContext>
        <PreloaderProvider>
          <PageLoaderProvider>
            <App />
          </PageLoaderProvider>
        </PreloaderProvider>
      </NavContext>
    </BrowserRouter>
  </StrictMode>,
)
