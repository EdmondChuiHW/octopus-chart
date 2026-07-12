import { useQuery } from '@tanstack/react-query';
import { fetchAgilePredict } from '../lib/queries';
import type { AgilePredictPrice } from '../lib/types';
import { minutesToMilliseconds } from 'date-fns';

export function useAgilePredict(tariff: string, enabled: boolean) {
  return useQuery<AgilePredictPrice[], Error, AgilePredictPrice[], [string, string]>({
    queryKey: ['agile-predict', tariff],
    queryFn: fetchAgilePredict,
    enabled,
    staleTime: minutesToMilliseconds(30),
    refetchInterval: minutesToMilliseconds(60),
    refetchIntervalInBackground: false,
    retry: false,
  });
}
