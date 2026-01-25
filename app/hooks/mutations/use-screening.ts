/**
 * Screening mutations
 */
import { useMutation } from '@tanstack/react-query'
import { runScreening, type ScreeningRequest, type ScreeningResponse } from '@/lib/api/screening'

export function useRunScreening() {
  return useMutation<ScreeningResponse, Error, ScreeningRequest>({
    mutationFn: runScreening,
  })
}
