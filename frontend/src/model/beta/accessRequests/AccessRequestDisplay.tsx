import { Card, Divider, Grid, Stack, Typography } from '@mui/material'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { AccessRequestInterface, ReviewRequestInterface, ReviewResponse } from 'types/interfaces'
import { formatDateString, sortByCreatedAtAscending } from 'utils/dateUtils'

import { useGetReviewRequestsForModel } from '../../../../actions/review'
import Loading from '../../../common/Loading'
import MessageAlert from '../../../MessageAlert'
import ReviewBanner from '../reviews/ReviewBanner'
import ReviewDisplay from '../reviews/ReviewDisplay'

type AccessRequestDisplayProps = {
  accessRequest: AccessRequestInterface
}

export default function AccessRequestDisplay({ accessRequest }: AccessRequestDisplayProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: accessRequest.modelId,
    accessRequestId: accessRequest.id,
  })

  const [reviewsWithLatestResponses, setReviewsWithLatestResponses] = useState<ReviewRequestInterface[]>([])

  useEffect(() => {
    if (!isReviewsLoading && reviews) {
      const result = reviews
      result.forEach((review) => {
        const groupedResponses: GroupedReviewResponse = _.groupBy(review.responses, (response) => response.user)
        Object.keys(groupedResponses).forEach((user) => {
          review.responses = [groupedResponses[user].sort(sortByCreatedAtAscending)[groupedResponses[user].length - 1]]
        })
      })
      setReviewsWithLatestResponses(result)
    }
  }, [reviews, isReviewsLoading])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  interface GroupedReviewResponse {
    [user: string]: ReviewResponse[]
  }

  return (
    <>
      {isReviewsLoading && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Card sx={{ width: '100%' }}>
          {reviews.length > 0 && <ReviewBanner accessRequest={accessRequest} />}
          <Stack p={2}>
            <Link href={`/beta/model/${accessRequest.modelId}/access-request/${accessRequest.id}`}>
              <Typography component='h2' variant='h6' color='primary'>
                {accessRequest.metadata.overview.name}
              </Typography>
            </Link>
            <Stack spacing={1} direction='row' justifyContent='space-between' sx={{ mb: 2 }}>
              <Typography variant='caption'>
                Created by {<UserDisplay dn={accessRequest.createdBy} />} on
                <Typography variant='caption' fontWeight='bold'>
                  {` ${formatDateString(accessRequest.createdAt)} `}
                </Typography>
              </Typography>
              {accessRequest.metadata.overview.endDate && (
                <Typography variant='caption'>
                  End Date:
                  <Typography variant='caption' fontWeight='bold'>
                    {` ${formatDateString(accessRequest.metadata.overview.endDate)}`}
                  </Typography>
                </Typography>
              )}
            </Stack>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              alignItems='flex-end'
              justifyContent='space-between'
              spacing={4}
            >
              <Card
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 2,
                  width: '100%',
                }}
              >
                <Typography variant='subtitle2' component='h3' mb={1}>
                  Users
                </Typography>
                <Grid container>
                  {accessRequest.metadata.overview.entities.map((entity) => (
                    <Grid item xs={3} key={entity}>
                      <UserDisplay dn={entity} />
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Stack>
            {reviewsWithLatestResponses.length > 0 && <Divider sx={{ my: 2 }} />}
            {reviewsWithLatestResponses.map((review) => (
              <ReviewDisplay review={review} key={review.accessRequestId} />
            ))}
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
