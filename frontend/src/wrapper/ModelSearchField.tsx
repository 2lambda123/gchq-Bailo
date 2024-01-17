import SearchIcon from '@mui/icons-material/Search'
import { Box, InputBase, List, ListItemButton, ListItemText, Popover, Stack } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { ChangeEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import useDebounce from 'utils/hooks/useDebounce'

const Search = styled('div')(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  paddingRight: theme.spacing(4),
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '16ch',
      '&:focus': {
        width: '25ch',
      },
    },
  },
}))

export default function ModelSearchField() {
  const [modelFilter, setModelFilter] = useState('')
  const debouncedFilter = useDebounce(modelFilter, 250)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { models, isModelsLoading, isModelsError } = useListModels([], '', [], debouncedFilter)

  const modelList = useMemo(() => models, [models])
  const searchMenuOpen = useMemo(() => !!anchorEl, [anchorEl])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setModelFilter(event.target.value)
    if (event.target.value.length >= 3) {
      setAnchorEl(event.currentTarget)
    }
  }

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' />
  }

  return (
    <Stack>
      <Search>
        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
          <SearchIcon sx={{ ml: 1 }} />
          <StyledInputBase
            placeholder='Search for a model'
            inputProps={{ 'aria-label': 'search for a model' }}
            value={modelFilter}
            onChange={handleChange}
          />
        </Stack>
      </Search>
      {searchMenuOpen && (
        <Popover
          open={searchMenuOpen}
          onClose={() => setAnchorEl(null)}
          anchorEl={anchorEl}
          disableAutoFocus
          disableEnforceFocus
          sx={{ maxHeight: '400px' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <>
            {isModelsLoading && <Loading />}
            {!isModelsLoading && (
              <List dense disablePadding>
                {modelList.map((model) => (
                  <Box key={model.id} sx={{ maxWidth: '300px' }}>
                    <Link href={`/beta/model/${model.id}`} noLinkStyle>
                      <ListItemButton>
                        <ListItemText
                          primary={model.name}
                          secondary={model.description}
                          primaryTypographyProps={{
                            style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
                          }}
                          secondaryTypographyProps={{
                            style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </Box>
                ))}
              </List>
            )}
          </>
        </Popover>
      )}
    </Stack>
  )
}
