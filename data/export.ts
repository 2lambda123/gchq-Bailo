import useSWR from 'swr'
import { fetcher } from '../utils/fetcher'

export function useExport(uuid: string, version: string) {
  const { data, error, mutate } = useSWR<{file: unknown}>(`/api/v1/export/${uuid}/version/${version}`, fetcher)

  return {
    mutateExport: mutate,
    message: data ? data.file : undefined,
    isExportLoading: !error && !data,
    isExportError: error,
  }
}