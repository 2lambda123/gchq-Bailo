import { Close, Done, HourglassEmpty } from '@mui/icons-material'
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { ApprovalStates, ReleaseInterface } from '../../types/types'
import Link from '../Link'

export default function ModelReleaseDisplay({
  modelId,
  release,
  latestRelease,
}: {
  modelId: string
  release: ReleaseInterface
  latestRelease: string
}) {
  const theme = useTheme()

  function formatDate(timestamp: string) {
    const date = new Date(timestamp)
    const year = date.getFullYear().toString()
    const formattedYear = `'${year.substring(date.getFullYear().toString().length - 2)}`
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${formattedYear}`
  }

  function approvalStatus(status: ApprovalStates, label: string) {
    switch (status) {
      case ApprovalStates.Accepted:
        return (
          <Tooltip title={`${label} has approved this release`}>
            <Done color='success' />
          </Tooltip>
        )
      case ApprovalStates.NoResponse:
        return (
          <Tooltip title={`${label} has not reviewed this release`}>
            <HourglassEmpty color='warning' />
          </Tooltip>
        )
      case ApprovalStates.Declined:
        return (
          <Tooltip title={`${label} has declined this release`}>
            <Close color='error' />
          </Tooltip>
        )
    }
  }

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Box
          sx={{
            border: 'solid 2px',
            borderRadius: 4,
            padding: 2,
            borderColor: theme.palette.primary.main,
            width: '100%',
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent='space-between'
              alignItems='center'
              spacing={2}
            >
              <Stack
                direction={{ sm: 'row', xs: 'column' }}
                justifyContent='space-between'
                alignItems='center'
                spacing={1}
              >
                <Typography variant='h6' color='primary'>
                  {release.name}
                </Typography>
                <Divider orientation='vertical' flexItem />
                <Typography color='secondary'>{release.semver}</Typography>
                {latestVersionAdornment()}
                <Divider orientation='vertical' flexItem />
                <Stack direction={{ sm: 'row', xs: 'column' }}>
                  {approvalStatus(ApprovalStates.Accepted, 'Manager')}
                  {approvalStatus(ApprovalStates.Accepted, 'Technical Reviewer')}
                </Stack>
              </Stack>

              <Link href={`/beta/model/${modelId}?release=${release.semver}`}>Model Card</Link>
            </Stack>
            <Stack spacing={1} direction='row' sx={{ mt: '0px !important' }}>
              <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                {formatDate(release.updatedAt)}
              </Typography>
              <Typography variant='caption'>Joe Blogs</Typography>
            </Stack>
            <Typography variant='body1'>{release.notes}</Typography>
            <Divider />
            <Stack spacing={0}>
              {release.files.map((file) => (
                <Stack
                  key={file}
                  direction={{ sm: 'row', xs: 'column' }}
                  justifyContent='space-between'
                  alignItems='center'
                  spacing={2}
                >
                  <Link href='/beta'>{file}</Link>
                  {/* <Typography variant='caption'>123GB</Typography> */}
                </Stack>
              ))}
              {release.images.map((image) => (
                <Stack
                  key={image}
                  direction={{ sm: 'row', xs: 'column' }}
                  justifyContent='space-between'
                  alignItems='center'
                  spacing={2}
                >
                  <Link href='/beta'>{image}</Link>
                  {/* <Typography variant='caption'>123GB</Typography> */}
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
