import CommentIcon from '@mui/icons-material/ChatBubble'
import { Box, Button, Card, Divider, LinearProgress, Stack, Tooltip, Typography } from '@mui/material'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserDisplay from 'src/common/UserDisplay'
import CodeLine from 'src/entry/model/registry/CodeLine'
import FileDownload from 'src/entry/model/releases/FileDownload'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import ReviewDisplay from 'src/entry/model/reviews/ReviewDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface, ReviewRequestInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { latestReviewsForEachUser } from 'utils/reviewUtils'

export interface ReleaseDisplayProps {
  model: EntryInterface
  release: ReleaseInterface
  latestRelease?: string
  hideReviewBanner?: boolean
}

export default function ReleaseDisplay({
  model,
  release,
  latestRelease,
  hideReviewBanner = false,
}: ReleaseDisplayProps) {
  const router = useRouter()

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
  })

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [reviewsWithLatestResponses, setReviewsWithLatestResponses] = useState<ReviewRequestInterface[]>([])

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  useEffect(() => {
    if (!isReviewsLoading && reviews) {
      const latestReviews = latestReviewsForEachUser(reviews)
      setReviewsWithLatestResponses(latestReviews)
    }
  }, [reviews, isReviewsLoading])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {(isReviewsLoading || isUiConfigLoading) && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Card sx={{ width: '100%' }}>
          {reviews.length > 0 && !hideReviewBanner && <ReviewBanner release={release} />}
          <Stack spacing={1} p={2}>
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
                <Link href={`/model/${model.id}/release/${release.semver}`}>
                  <Typography component='h2' variant='h6' color='primary'>
                    {model.name} - {release.semver}
                  </Typography>
                </Link>
                <CopyToClipboardButton
                  textToCopy={`${model.name} - ${release.semver}`}
                  notificationText='Copied release semver to clipboard'
                  ariaLabel='copy release semver to clipboard'
                />
                {latestVersionAdornment()}
              </Stack>
              <Button onClick={() => router.push(`/model/${model.id}/history/${release.modelCardVersion}`)}>
                View Model Card
              </Button>
            </Stack>
            <Typography variant='caption' sx={{ mb: 2 }}>
              Created by {<UserDisplay dn={release.createdBy} />} on
              <Typography variant='caption' fontWeight='bold'>
                {` ${formatDateString(release.createdAt)}`}
              </Typography>
            </Typography>
            <MarkdownDisplay>{release.notes}</MarkdownDisplay>
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={1}>
              {release.files.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Files</Typography>
                  {release.files.map((file) => (
                    <FileDownload key={file.name} file={file} modelId={model.id} />
                  ))}
                </>
              )}
              {release.images.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Docker images</Typography>
                  {release.images.map((image) => (
                    <Stack
                      key={`${image.repository}-${image.name}-${image.tag}`}
                      direction={{ sm: 'row', xs: 'column' }}
                      justifyContent='space-between'
                      alignItems='center'
                      spacing={1}
                    >
                      {uiConfig && (
                        <CodeLine line={`${uiConfig.registry.host}/${model.id}/${image.name}:${image.tag}`} />
                      )}
                    </Stack>
                  ))}
                </>
              )}
              {(reviewsWithLatestResponses.length > 0 || release.comments.length > 0) && <Divider />}
              <Stack direction='row' justifyContent='space-between' spacing={2}>
                <div>
                  <ReviewDisplay reviews={reviewsWithLatestResponses} />
                </div>
                {release.comments.length > 0 && (
                  <Tooltip title='Comments'>
                    <Stack direction='row' spacing={1}>
                      <CommentIcon color='primary' />
                      <Typography variant='caption'>{release.comments.length}</Typography>
                    </Stack>
                  </Tooltip>
                )}
              </Stack>
              <Divider flexItem />
              <Box>
                <Typography fontWeight='bold'>Mirror in progress...</Typography>
                <Typography>File 5/10 - MyDocument.docx</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant='determinate' value={50} />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant='body2' color='text.secondary'>
                      50%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
