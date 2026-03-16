'use client';

import { useState, useEffect } from 'react';
import { formatRelativeDate, formatLocalDate } from '@/lib/dateUtils';

export default function RelativeDate({ date }: { date: string }) {
  const [text, setText] = useState(formatLocalDate(date));

  useEffect(() => {
    setText(formatRelativeDate(date));
  }, [date]);

  return <>{text}</>;
}
