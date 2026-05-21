import { useEffect } from 'react';

let lockCount = 0;

export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      lockCount++;
      if (lockCount === 1) {
        document.body.style.setProperty('overflow', 'hidden', 'important');
        document.body.classList.add('modal-open');
      }
      return () => {
        lockCount--;
        if (lockCount === 0) {
          document.body.style.removeProperty('overflow');
          document.body.classList.remove('modal-open');
        }
      };
    }
  }, [lock]);
}
