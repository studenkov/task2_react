import { useEffect, useState } from 'react';

export function useDelayedLoading(isLoading, delay = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => {
      clearTimeout(timer);
      setShow(false);
    };
  }, [isLoading, delay]);

  return isLoading && show;
}
