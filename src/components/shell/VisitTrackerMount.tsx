'use client';

import { useEffect } from 'react';
import { trackVisit } from '@/lib/visitTracker';

export function VisitTrackerMount() {
  useEffect(() => {
    void trackVisit();
  }, []);
  return null;
}
