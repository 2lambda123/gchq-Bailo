import { useGetCurrentUser } from 'actions/user'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import AuthenticationTab from 'src/settings/beta/authentication/AuthenticationTab'
import ProfileTab from 'src/settings/beta/ProfileTab'
import Wrapper from 'src/Wrapper.beta'

export default function Settings() {
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const tabs = useMemo(
    () =>
      currentUser
        ? [
            { title: 'Profile', path: 'profile', view: <ProfileTab user={currentUser} /> },
            { title: 'Authentication', path: 'authentication', view: <AuthenticationTab /> },
          ]
        : [],
    [currentUser],
  )

  const error = MultipleErrorWrapper(`Unable to load settings page`, {
    isCurrentUserError,
  })
  if (error) return error

  return (
    <Wrapper fullWidth title='Settings' page='settings'>
      {isCurrentUserLoading && <Loading />}
      <PageWithTabs title='Settings' tabs={tabs} />
    </Wrapper>
  )
}
