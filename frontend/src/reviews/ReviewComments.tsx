import { LoadingButton } from '@mui/lab'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchAccessRequestComments, useGetAccessRequest } from 'actions/accessRequest'
import { submitReleaseComment, useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import ReviewCommentDisplay from 'src/reviews/ReviewCommentDisplay'
import ReviewDecisionDisplay from 'src/reviews/ReviewDecisionDisplay'
import { AccessRequestInterface, ReviewResponse } from 'types/interfaces'
import { isReviewResponse, ReleaseInterface, ReviewComment, ReviewResponseKind } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

type ReviewCommentsProps =
  | {
      release: ReleaseInterface
      accessRequest?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
    }

export default function ReviewComments({ release, accessRequest }: ReviewCommentsProps) {
  const [newReviewComment, setNewReviewComment] = useState('')
  const [commentSubmissionError, setCommentSubmissionError] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { mutateRelease } = useGetRelease(release?.modelId, release?.semver)
  const { mutateAccessRequest } = useGetAccessRequest(accessRequest?.modelId, accessRequest?.id)

  const theme = useTheme()

  const [modelId, semverOrAccessRequestIdObject] = useMemo(
    () =>
      release
        ? [release.modelId, { semver: release.semver }]
        : [accessRequest.modelId, { accessRequestId: accessRequest.id }],
    [release, accessRequest],
  )

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    ...semverOrAccessRequestIdObject,
  })

  const reviewDetails = useMemo(() => {
    let decisionsAndComments: Array<ReviewResponseKind> = []
    reviews.forEach((review) => {
      review.responses.forEach((response) => decisionsAndComments.push(response))
    })
    if (release && release.comments) {
      decisionsAndComments = [...decisionsAndComments, ...release.comments]
    }
    if (accessRequest && accessRequest.comments) {
      decisionsAndComments = [...decisionsAndComments, ...accessRequest.comments]
    }
    decisionsAndComments.sort(sortByCreatedAtAscending)
    return decisionsAndComments.map((response) => {
      if (isReviewResponse(response)) {
        return <ReviewDecisionDisplay key={response.createdAt} response={response as ReviewResponse} />
      } else {
        return <ReviewCommentDisplay key={response.createdAt} response={response as ReviewComment} />
      }
    })
  }, [reviews, release, accessRequest])

  async function submitReviewComment() {
    setCommentSubmissionError('')
    setSubmitButtonLoading(true)
    if (!newReviewComment) {
      setCommentSubmissionError('Please provide a comment before submitting.')
      setSubmitButtonLoading(false)
      return
    }
    if (release) {
      const res = await submitReleaseComment(modelId, release.semver, newReviewComment)
      if (res.ok) {
        mutateRelease()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
    } else if (accessRequest) {
      const res = await patchAccessRequestComments(accessRequest.modelId, accessRequest.id, newReviewComment)
      if (res.ok) {
        mutateAccessRequest()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
    } else {
      setCommentSubmissionError('There was a problem submitting this comment, please try again later.')
    }
    setSubmitButtonLoading(false)
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {reviews.length > 0 && <Divider />}
      {isReviewsLoading && isCurrentUserLoading && <Loading />}
      {reviewDetails}
      <>
        {currentUser && (
          <Stack spacing={1} justifyContent='center' alignItems='flex-end'>
            <Box sx={{ width: '100%' }}>
              <RichTextEditor
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e)}
                textareaProps={{ placeholder: 'Add a comment' }}
              />
            </Box>
            <LoadingButton
              sx={{ mt: 1 }}
              variant='contained'
              onClick={submitReviewComment}
              loading={submitButtonLoading}
            >
              Submit comment
            </LoadingButton>
            <Typography variant='caption' color={theme.palette.error.light}>
              {commentSubmissionError}
            </Typography>
          </Stack>
        )}
      </>
    </>
  )
}
