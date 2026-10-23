import { useQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';
import { fetchAgileForecast } from '../lib/queries';
import type { ForecastSlot } from '../lib/types';

export function useAgilePredict(tariff: string, enabled: boolean) {
  return useQuery<ForecastSlot[], Error, ForecastSlot[], [string, string]>({
    queryKey: ['agile-predict', tariff],
    queryFn: fetchAgileForecast,
    enabled,
    staleTime: minutesToMilliseconds(30),
    refetchInterval: minutesToMilliseconds(60),
    refetchIntervalInBackground: false,
    retry: false,
  });
}
