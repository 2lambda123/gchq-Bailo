import ArrowBack from '@mui/icons-material/ArrowBack'
import { LoadingButton } from '@mui/lab'
import { Button, Card, Stack, Typography } from '@mui/material'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import { getErrorMessage } from 'utils/fetcher'

import { postAccessRequest } from '../../../../actions/accessRequest'
import { useGetModel } from '../../../../actions/model'
import { useGetSchema } from '../../../../actions/schema'
import Loading from '../../../../src/common/Loading'
import JsonSchemaForm from '../../../../src/Form/JsonSchemaForm'
import MessageAlert from '../../../../src/MessageAlert'
import Wrapper from '../../../../src/Wrapper'
import { SplitSchemaNoRender } from '../../../../types/interfaces'
import { getStepsData, getStepsFromSchema, setStepValidate, validateForm } from '../../../../utils/formUtils'

export default function NewAccessRequest() {
  const router = useRouter()

  const { modelId, schemaId }: { modelId?: string; schemaId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [submissionErrorText, setSubmissionErrorText] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)

  const currentUserId = useMemo(() => (currentUser ? currentUser?.dn : ''), [currentUser])
  const isLoading = useMemo(
    () => isSchemaLoading || isModelLoading || isCurrentUserLoading,
    [isCurrentUserLoading, isModelLoading, isSchemaLoading],
  )

  useEffect(() => {
    if (!model || !schema) return
    const defaultState = {
      overview: { entities: [currentUserId] },
    }
    const steps = getStepsFromSchema(schema, {}, [], defaultState)
    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model, currentUserId])

  async function onSubmit() {
    setSubmissionErrorText('')
    setSubmitButtonLoading(true)

    if (!modelId || !schemaId) {
      setSubmissionErrorText(`Please wait until the page has finished loading before attempting to submit.`)
      setSubmitButtonLoading(false)
      return
    }

    for (const step of splitSchema.steps) {
      // The user has tried to submit, so let's enable schema validation for each page
      setStepValidate(splitSchema, setSplitSchema, step, true)
    }

    for (const step of splitSchema.steps) {
      const isValid = validateForm(step)

      if (!isValid) {
        setSubmissionErrorText('Please make sure that all sections have been completed.')
        setSubmitButtonLoading(false)
        return
      }
    }

    const data = getStepsData(splitSchema, true)
    const res = await postAccessRequest(modelId, schemaId, data)

    if (!res.ok) {
      setSubmissionErrorText(await getErrorMessage(res))
      setSubmitButtonLoading(false)
    } else {
      const body = await res.json()
      router.push(`/model/${modelId}/access-request/${body.accessRequest.id}`)
    }
  }

  const error = MultipleErrorWrapper(`Unable to load access request page`, {
    isModelError,
    isSchemaError,
    isCurrentUserError,
  })
  if (error) return error

  return (
    <Wrapper title='Access Request' page='Model'>
      {isLoading && <Loading />}
      {!isLoading && (
        <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
          {(!model || !model.card) && (
            <Typography>Access requests can not be requested if a schema is not set for this model.</Typography>
          )}
          {model && model.card && (
            <Stack spacing={4}>
              <Link href={`/model/${modelId}/access-request/schema`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Select a different schema
                </Button>
              </Link>
              <JsonSchemaForm
                splitSchema={splitSchema}
                setSplitSchema={setSplitSchema}
                canEdit
                displayLabelValidation
              />
              <Stack alignItems='flex-end'>
                <LoadingButton
                  sx={{ width: 'fit-content' }}
                  variant='contained'
                  onClick={onSubmit}
                  loading={submitButtonLoading}
                >
                  Submit
                </LoadingButton>
                <MessageAlert message={submissionErrorText} severity='error' />
              </Stack>
            </Stack>
          )}
        </Card>
      )}
    </Wrapper>
  )
}
