import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useGetModel } from 'actions/model'
import { postFromSchema } from 'actions/modelCard'
import { useGetSchemas } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import SchemaButton from 'src/schemas/SchemaButton'
import {
  EntryInterface,
  EntryKind,
  EntryKindLabel,
  SchemaInterface,
  SchemaKind,
  SchemaKindKeys,
  SchemaKindLabel,
} from 'types/types'

type SchemaSelectProps = {
  schemaKind: SchemaKindKeys
  entry: EntryInterface
}

export default function SchemaSelect({ schemaKind, entry }: SchemaSelectProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(schemaKind)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const { mutateModel: mutateEntry } = useGetModel(entry.id, EntryKind[schemaKind])

  const isLoadingData = useMemo(
    () => isSchemasLoading || isCurrentUserLoading,
    [isCurrentUserLoading, isSchemasLoading],
  )

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  const accessRequestCallback = useCallback(
    async (newSchema: SchemaInterface) => {
      setLoading(true)
      router.push(`/model/${entry.id}/access-request/new?schemaId=${newSchema.id}`)
    },
    [entry.id, router],
  )

  const entryCallback = useCallback(
    async (newSchema: SchemaInterface) => {
      if (currentUser && entry) {
        setLoading(true)
        setErrorMessage('')

        const response = await postFromSchema(entry.id, newSchema.id)

        if (response.status && response.status < 400) {
          await mutateEntry()
          router.push(`/${entry.kind}/${entry.id}`)
        } else {
          setErrorMessage(response.data)
          setLoading(false)
        }
      }
    },
    [currentUser, entry, mutateEntry, router],
  )

  const accordionStyling = {
    '&:before': {
      display: 'none',
    },
    width: '100%',
  } as const

  const selectionCallback = useMemo(
    () => (schemaKind === SchemaKind.ACCESS_REQUEST ? accessRequestCallback : entryCallback),
    [schemaKind, accessRequestCallback, entryCallback],
  )

  const activeSchemaButtons = useMemo(
    () =>
      activeSchemas.length ? (
        activeSchemas.map((activeSchema) => (
          <SchemaButton
            key={activeSchema.id}
            schema={activeSchema}
            loading={loading}
            onClick={() => selectionCallback(activeSchema)}
          />
        ))
      ) : (
        <EmptyBlob text='Could not find any active schemas' />
      ),
    [activeSchemas, selectionCallback, loading],
  )

  const inactiveSchemaButtons = useMemo(
    () =>
      inactiveSchemas.length ? (
        inactiveSchemas.map((inactiveSchema) => (
          <SchemaButton
            key={inactiveSchema.id}
            schema={inactiveSchema}
            loading={loading}
            onClick={() => selectionCallback(inactiveSchema)}
          />
        ))
      ) : (
        <EmptyBlob text='Could not find any inactive schemas' />
      ),
    [inactiveSchemas, selectionCallback, loading],
  )

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isLoadingData && <Loading />}
      {!isLoadingData && (
        <Container maxWidth='md'>
          <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={`/${entry.kind}/${entry.id}`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                {`Back to ${EntryKindLabel[entry.kind]}`}
              </Button>
            </Link>
            <Stack spacing={2} justifyContent='center' alignItems='center'>
              <Typography variant='h5' component='h1' color='primary'>
                Choose a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography variant='body1'>
                Each organisation may have a different set of questions they require you to answer about any
                {` ${SchemaKindLabel[schemaKind]}`} you create. Select from the list below:
              </Typography>
            </Stack>
            <Stack sx={{ mt: 2 }} spacing={2} alignItems='center'>
              <Accordion defaultExpanded sx={accordionStyling}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ width: '100%' }} align='center' color='primary' variant='h6' component='h2'>
                    Active Schemas
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2} justifyContent='center'>
                    {activeSchemaButtons}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              <Accordion sx={accordionStyling}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ width: '100%' }} align='center' color='primary' variant='h6' component='h2'>
                    Inactive Schemas
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2} justifyContent='center'>
                    {inactiveSchemaButtons}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              <MessageAlert message={errorMessage} severity='error' />
            </Stack>
          </Card>
        </Container>
      )}
    </>
  )
}
