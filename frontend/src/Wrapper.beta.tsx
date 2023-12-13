import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Head from 'next/head'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import MessageAlert from 'src/MessageAlert'

import { useGetCurrentUser } from '../actions/user'
import { useGetUiConfig } from '../data/uiConfig'
import Banner from './Banner'
import Copyright from './Copyright'
import SideNavigation from './wrapper/SideNavigation'
import TopNavigation from './wrapper/TopNavigation'

type WrapperProps = {
  title: string
  page: string
  children?: ReactNode
  fullWidth?: boolean
}

export default function Wrapper({ title, page, children, fullWidth = false }: WrapperProps): ReactElement {
  const isDocsPage = useMemo(() => page.startsWith('docs'), [page])

  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [pageTopStyling, setPageTopStyling] = useState({})
  const [contentTopStyling, setContentTopStyling] = useState({})
  const [errorMessage, setErrorMessage] = useState('')

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { currentUser } = useGetCurrentUser()

  useEffect(() => {
    if (!isUiConfigLoading) {
      if (uiConfig && uiConfig.banner.enabled) {
        setPageTopStyling({
          mt: 4,
        })
        setContentTopStyling({
          mt: isDocsPage ? 4 : 8,
        })
      }
    }
  }, [isUiConfigLoading, uiConfig, isDocsPage])

  const handleSideNavigationError = useCallback((message: string) => setErrorMessage(message), [])

  const resetErrorMessage = useCallback(() => setErrorMessage(''), [])

  const toggleDrawer = (): void => {
    setOpen(!open)
  }

  if (isUiConfigError) {
    if (isUiConfigError.status === 403) {
      return <p>Error authenticating user.</p>
    }

    return <p>Error loading UI Config: {isUiConfigError.info?.message}</p>
  }

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{`${title} :: Bailo`}</title>
      </Head>
      <Banner />
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {!isUiConfigLoading && uiConfig && uiConfig.banner.enabled && <Box sx={{ mt: 20 }} />}
        {currentUser && (
          <TopNavigation
            drawerOpen={open}
            pageTopStyling={pageTopStyling}
            toggleDrawer={toggleDrawer}
            currentUser={currentUser}
          />
        )}
        {currentUser && (
          <SideNavigation
            page={page}
            currentUser={currentUser}
            drawerOpen={open}
            pageTopStyling={pageTopStyling}
            toggleDrawer={toggleDrawer}
            onError={handleSideNavigationError}
            onResetErrorMessage={resetErrorMessage}
          />
        )}
        <Box
          component='main'
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Box sx={contentTopStyling}>
            {isDocsPage ? (
              children
            ) : (
              <>
                {!fullWidth && (
                  <Container maxWidth={fullWidth ? false : 'xl'} sx={{ mt: 4, mb: 4 }}>
                    <MessageAlert message={errorMessage} severity='error' />
                    {children}
                  </Container>
                )}
                {fullWidth && (
                  <>
                    <MessageAlert message={errorMessage} severity='error' />
                    {children}
                  </>
                )}
                <Copyright sx={{ mb: 2 }} />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
