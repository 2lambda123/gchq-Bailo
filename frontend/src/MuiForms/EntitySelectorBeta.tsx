import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { FormContextType } from '@rjsf/utils'
import { debounce } from 'lodash'
import { KeyboardEvent, SyntheticEvent, useCallback, useState } from 'react'
import { EntityObject } from 'types/v2/types'

import { useGetCurrentUser, useListUsers } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorBetaProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  formContext?: FormContextType
}

export default function EntitySelectorBeta(props: EntitySelectorBetaProps) {
  const { onChange, value: currentValue, required, label, formContext } = props

  const [open, setOpen] = useState(false)
  const [userListQuery, setUserListQuery] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<EntityObject[]>([])

  const { users, isUsersError } = useListUsers(userListQuery)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const theme = useTheme()

  const handleUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValues: EntityObject[]) => {
      onChange(newValues.map((value) => `${value.kind}:${value.id}`))
      setSelectedEntities(newValues)
    },
    [onChange],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, [])

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  if (isUsersError) {
    return <MessageAlert message={isUsersError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      {currentUser && formContext && formContext.editMode && (
        <Autocomplete<EntityObject, true, true>
          multiple
          data-test='entitySelector'
          open={open}
          size='small'
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          disableClearable
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.id}
          value={selectedEntities || []}
          onChange={handleUserChange}
          noOptionsText={userListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
          onInputChange={debounceOnInputChange}
          options={users || []}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Box key={option.id} sx={{ maxWidth: '200px' }}>
                <Chip {...getTagProps({ index })} sx={{ textOverflow: 'ellipsis' }} label={option.id} />
              </Box>
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={label + (required ? ' *' : '')}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Backspace') {
                  event.stopPropagation()
                }
              }}
            />
          )}
        />
      )}
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: 'red' }}>{' *'}</span>}
          </Typography>
          {currentValue.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {currentValue.map((entity) => (
                <Chip label={entity.split(':')[1] || entity} key={entity} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
