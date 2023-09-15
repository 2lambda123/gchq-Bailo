import axios from 'axios'
import useSWR from 'swr'
import { ModelCardInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

import { handleAxiosError } from '../utils/axios'

export async function postFromSchema(modelId: string, schemaId: string) {
  try {
    const response = await axios({
      method: 'post',
      url: `/api/v2/model/${modelId}/setup/from-schema`,
      headers: { 'Content-Type': 'application/json' },
      data: { schemaId },
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

export async function putModelCard(modelId: string, metadata: unknown) {
  try {
    const response = await axios({
      method: 'put',
      url: `/api/v2/model/${modelId}/model-cards`,
      headers: { 'Content-Type': 'application/json' },
      data: { metadata: metadata },
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

export function useModelCard(modelId?: string, modelCardVersion?: number) {
  const { data, error } = useSWR<
    {
      modelCard: ModelCardInterface
    },
    ErrorInfo
  >(modelId && modelCardVersion ? `/api/v2/model/${modelId}/model-card/${modelCardVersion}` : null, fetcher)

  return {
    model: data ? data.modelCard : undefined,
    isModelLoading: !error && !data,
    isModelError: error,
  }
}
