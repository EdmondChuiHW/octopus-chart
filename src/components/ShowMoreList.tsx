import { type ReactNode, useState } from 'react';

export function ShowMoreList({
  children,
  initialCount = 3,
}: {
  children: ReactNode[];
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);

  return (
    <>
      {children.slice(0, count)}
      {count < children.length && (
        <a
          href="javascript:void(0)"
          onClick={() => setCount((c) => c + initialCount)}
        >
          Show more
        </a>
      )}
    </>
  );
}
