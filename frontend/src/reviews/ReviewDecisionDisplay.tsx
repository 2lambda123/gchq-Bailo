import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Card, Divider, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import UserAvatar from 'src/common/UserAvatar'
import { ReviewResponse } from 'types/interfaces'
import { EntityKind } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type ReviewDecisionProps = {
  response: ReviewResponse
}

export default function ReviewDecision({ response }: ReviewDecisionProps) {
  const isApproved = useMemo(() => response.decision === 'approve', [response.decision])

  const username = response.user.split(':')[0]

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
      <Card
        sx={{
          width: '100%',
          p: 1,
        }}
      >
        <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }} justifyContent='space-between'>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Typography>
              <Box component='span' fontWeight='bold'>
                {username}
              </Box>
              {` ${isApproved ? 'has approved this release' : 'has requested changes'}`}
            </Typography>
            {isApproved ? (
              <Done color='success' fontSize='small' />
            ) : (
              <HourglassEmpty color='warning' fontSize='small' />
            )}
          </Stack>
          <Typography fontWeight='bold'>{formatDateString(response.createdAt)}</Typography>
        </Stack>
        {response.comment && (
          <div>
            <Divider sx={{ my: 2 }} />
            <Typography>{response.comment}</Typography>
          </div>
        )}
      </Card>
    </Stack>
  )
}
