import OrganisationIcon from '@mui/icons-material/Business'
import ContentCopy from '@mui/icons-material/ContentCopy'
import EmailIcon from '@mui/icons-material/Email'
import UserIcon from '@mui/icons-material/Person'
import { Box, Divider, IconButton, Popover, Stack, Typography } from '@mui/material'
import { useGetUserInformation } from 'actions/user'
import { MouseEvent, useMemo, useRef, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

export interface UserInformation {
  name?: string
  organisation?: string
  email?: string
}

type UserDisplayProps = {
  dn: string
  hidePopover?: boolean
}

export default function UserDisplay({ dn, hidePopover = false }: UserDisplayProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = useMemo(() => !!anchorEl, [anchorEl])
  const ref = useRef<HTMLDivElement>(null)

  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetUserInformation(
    dn.includes(':') ? dn.split(':')[1] : dn,
  )

  function handleCopyButtonClick() {
    if (userInformation && userInformation.email) {
      navigator.clipboard.writeText(userInformation.email)
    }
  }

  const popoverEnter = () => {
    if (ref.current) {
      setAnchorEl(ref.current)
    }
  }

  const popoverLeave = () => {
    setAnchorEl(null)
  }

  if (isUserInformationError) {
    return <MessageAlert message={isUserInformationError.info.message} severity='error' />
  }

  if (isUserInformationLoading || !userInformation) {
    return <Loading />
  }

  return (
    <>
      <Box
        component='span'
        ref={ref}
        aria-owns={open ? 'user-popover' : undefined}
        aria-haspopup='true'
        sx={{ fontWeight: 'bold' }}
        onMouseEnter={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
      >
        {userInformation.name}
      </Box>
      {!hidePopover && (
        <Popover
          id='user-popover'
          sx={{
            pointerEvents: 'none',
          }}
          PaperProps={{ onMouseEnter: popoverEnter, onMouseLeave: popoverLeave, sx: { pointerEvents: 'auto' } }}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          onClose={() => setAnchorEl(null)}
          disableRestoreFocus
        >
          <Stack spacing={1} sx={{ p: 2 }}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <UserIcon color='primary' />
              <Typography color='primary' fontWeight='bold'>
                {userInformation.name}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction='row' spacing={1}>
              <OrganisationIcon color='primary' />
              <Typography>
                <Box component='span' fontWeight='bold'>
                  Organisation
                </Box>
                : {userInformation.organisation}
              </Typography>
            </Stack>
            <Stack direction='row' spacing={1} alignItems='center'>
              <EmailIcon color='primary' />
              <Typography>
                <Box component='span' fontWeight='bold'>
                  Email
                </Box>
                : {userInformation.email}
              </Typography>
              <IconButton onClick={() => handleCopyButtonClick()} aria-label='Copy text to clipboard' size='small'>
                <ContentCopy color='primary' />
              </IconButton>
            </Stack>
          </Stack>
        </Popover>
      )}
    </>
  )
}
