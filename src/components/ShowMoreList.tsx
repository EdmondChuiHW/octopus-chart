import { type ReactNode, useState } from 'react';

export function ShowMoreList({
  children,
  initialCount = 5,
}: {
  children: ReactNode[];
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);
  const remaining = children.length - count;

  return (
    <>
      {children.slice(0, count)}
      {count < children.length && (
        <a
          href="javascript:void(0)"
          onClick={() => setCount((c) => c + initialCount)}
        >
          Show more {remaining > 0 ? `(${remaining})` : ''}
        </a>
      )}
    </>
  );
}
