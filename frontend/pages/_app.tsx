import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/terminal.css'
import '../public/css/highlight.css'
import 'reactflow/dist/style.css'

import { CacheProvider, EmotionCache } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { TourProvider } from '@reactour/tour'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'

import createEmotionCache from '../components/createEmotionCache'
import ThemeModeContext from '../src/contexts/themeModeContext'
import useThemeMode from '../utils/hooks/useThemeMode'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  const themeModeValue = useThemeMode()

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={themeModeValue.theme}>
        <ThemeModeContext.Provider value={themeModeValue}>
          <TourProvider
            steps={[
              {
                selector: '.bailo-menu-button',
                content: 'This is the Bailo menu button!',
              },
            ]}
          >
            <SnackbarProvider>
              <CssBaseline />
              <Component {...pageProps} />
            </SnackbarProvider>
          </TourProvider>
        </ThemeModeContext.Provider>
      </ThemeProvider>
    </CacheProvider>
  )
}
