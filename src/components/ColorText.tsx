import { type PropsWithChildren, useMemo } from 'react';
import { COLORS } from '../lib/colors';

import './ColorText.css';

type Props = PropsWithChildren<{
  type: 'set' | 'start' | 'end';
  radioFormAware?: boolean;
}>;

export function ColorText({ type, children, radioFormAware }: Props) {
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
      className={`color-text${radioFormAware ? ' radio-form-aware' : ''}`}
      style={{ textDecorationColor: colour }}
    >
      {children}
    </span>
  );
}
