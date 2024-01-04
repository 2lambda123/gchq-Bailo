import { ContentCopy, Visibility, VisibilityOff } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/v2/types'

type TokenDialogProps = {
  token?: TokenInterface
}

export default function TokenDialog({ token }: TokenDialogProps) {
  const theme = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  useEffect(() => {
    if (token) setOpen(true)
  }, [token])

  const handleClose = () => {
    setIsLoading(true)
    router.push('/beta/settings?tab=authentication&category=personal')
  }

  const handleCopyAccessKey = () => {
    if (token) navigator.clipboard.writeText(token.accessKey)
  }

  const handleCopySecretKey = () => {
    if (token?.secretKey) navigator.clipboard.writeText(token.secretKey)
  }

  const handleToggleAccessKeyVisibility = () => {
    setShowAccessKey(!showAccessKey)
  }

  const handleToggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Token</DialogTitle>
      <DialogContent>
        <MessageAlert
          message='You will never be able to access this token again. Make sure to copy it to a safe place.'
          severity='warning'
        />
        <Grid container spacing={1} alignItems='center'>
          <Grid item xs={2}>
            <Typography>Access Key</Typography>
          </Grid>
          <Grid item xs={8}>
            <Box
              sx={{
                backgroundColor: theme.palette.container.main,
                px: 2,
                py: 1,
                display: 'flex',
              }}
            >
              <Typography sx={{ mx: 'auto' }}>
                {showAccessKey ? token?.accessKey || '' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title='Copy to clipboard' placement='top'>
              <IconButton onClick={handleCopyAccessKey} aria-label='copy access key to clipboard'>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title={`${showAccessKey ? 'Hide' : 'Show'} access key`} placement='top'>
              <IconButton
                onClick={handleToggleAccessKeyVisibility}
                aria-label={`${showAccessKey ? 'Hide' : 'Show'} access key`}
              >
                {showAccessKey ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={2}>
            <Typography>Secret Key</Typography>
          </Grid>
          <Grid item xs={8}>
            <Box
              sx={{
                backgroundColor: theme.palette.container.main,
                px: 2,
                py: 1,
                display: 'flex',
              }}
            >
              <Typography sx={{ mx: 'auto' }}>
                {showSecretKey ? token?.secretKey || '' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title='Copy to clipboard'>
              <IconButton onClick={handleCopySecretKey} aria-label='copy secret key to clipboard'>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title={`${showSecretKey ? 'Hide' : 'Show'} secret key`}>
              <IconButton
                onClick={handleToggleSecretKeyVisibility}
                aria-label={`${showSecretKey ? 'Hide' : 'Show'} secret key`}
              >
                {showSecretKey ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
