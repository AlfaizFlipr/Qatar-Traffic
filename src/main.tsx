import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import './styles/global.scss'
import '@mantine/core/styles.css'
import { LandingPage } from './pages/LandingPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light">
      <LandingPage />
    </MantineProvider>
  </StrictMode>,
)
