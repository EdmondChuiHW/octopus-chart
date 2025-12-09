import { useEffect, useRef, useState } from 'react';
import { minutesToMilliseconds } from 'date-fns';
import './UpdateBanner.css';

const POLL_INTERVAL = minutesToMilliseconds(5);

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const initialVersionRef = useRef<string>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = 0;

    const fetchAndSchedule = async () => {
      try {
        const res = await fetch('/version.txt');
        const text = await res.text();
        if (!isMounted) return;

        const version = text.trim().split('\n', 1)[0];
        if (initialVersionRef.current === null) {
          initialVersionRef.current = version;
        } else if (version !== initialVersionRef.current) {
          setShowBanner(true);
        }
      } catch {
        // no-op
      }
      if (isMounted && !showBanner) {
        timeoutId = setTimeout(fetchAndSchedule, POLL_INTERVAL);
      }
    };

    void fetchAndSchedule();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <div className="update-banner">
      New version available.{' '}
      <button onClick={() => window.location.reload()}>Update</button>
    </div>
  );
}
