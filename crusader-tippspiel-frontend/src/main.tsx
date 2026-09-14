import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {MantineProvider} from '@mantine/core';
import {Notifications} from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import App from './App.tsx'

/**
 * Global entry point for the React application.
 * Initializes the root DOM node and wraps the application infrastructure with required foundational
 * providers (MantineProvider for functional UI components and contextual theming, Notifications for active alerts).
 */
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MantineProvider>
            <Notifications/>
            <App/>
        </MantineProvider>
    </StrictMode>,
)
