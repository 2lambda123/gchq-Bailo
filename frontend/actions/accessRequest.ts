import useSWR from 'swr'
import { AccessRequestInterface } from 'types/interfaces'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetAccessRequestsForModelId(modelId?: string) {
  const { data, error, mutate } = useSWR<
    {
      accessRequests: AccessRequestInterface[]
    },
    ErrorInfo
  >(modelId ? `/api/v2/model/${modelId}/access-requests` : null, fetcher)

  return {
    mutateAccessRequests: mutate,
    accessRequests: data ? data.accessRequests : [],
    isAccessRequestsLoading: !error && !data,
    isAccessRequestsError: error,
  }
}

export function useGetAccessRequest(modelId: string | undefined, accessRequestId: string | undefined) {
  const { data, error, mutate } = useSWR<
    {
      accessRequest: AccessRequestInterface
    },
    ErrorInfo
  >(accessRequestId && modelId ? `/api/v2/model/${modelId}/access-request/${accessRequestId}` : null, fetcher)

  return {
    mutateAccessRequest: mutate,
    accessRequest: data ? data.accessRequest : undefined,
    isAccessRequestLoading: !error && !data,
    isAccessRequestError: error,
  }
}

export function postAccessRequest(modelId: string, schemaId: string, form: any) {
  return fetch(`/api/v2/model/${modelId}/access-requests`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: { ...form }, schemaId: schemaId }),
  })
}

export function patchAccessRequest(modelId: string, accessRequestId: string, form: any) {
  return fetch(`/api/v2/model/${modelId}/access-request/${accessRequestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: { ...form } }),
  })
}
