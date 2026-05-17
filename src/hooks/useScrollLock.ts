import { useEffect } from 'react';

let lockCount = 0;

export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      lockCount++;
      if (lockCount === 1) {
        document.body.style.setProperty('overflow', 'hidden', 'important');
      }
      return () => {
        lockCount--;
        if (lockCount === 0) {
          document.body.style.removeProperty('overflow');
        }
      };
    }
  }, [lock]);
}
