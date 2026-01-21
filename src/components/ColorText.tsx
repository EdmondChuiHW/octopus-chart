import { type PropsWithChildren, useMemo } from 'react';
import { COLORS } from '../lib/colors';

export function ColorText({
  type,
  children,
}: PropsWithChildren<{ type: 'set' | 'start' | 'end' }>) {
  const colour = useMemo(() => {
    switch (type) {
      case 'set':
        return COLORS.PRIMARY_BLUE;
      case 'start':
        return COLORS.TIMER.START;
      case 'end':
        return COLORS.TIMER.END;
      default:
        throw new Error(`Unknown type: ${type satisfies never}`);
    }
  }, [type]);

  return (
    <span
      style={{
        textDecorationColor: colour,
        textDecorationLine: 'underline',
        textDecorationThickness: '3px',
        textUnderlineOffset: '4px',
        // textUnderlinePosition: 'under',
        fontWeight: 'bold',
      }}
    >
      {children}
    </span>
  );
}
