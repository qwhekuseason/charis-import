import React from 'react';

// "All products" → All <em>products</em> — the last word in italic serif gold, like the home page.
export const AccentTitle = ({ text }) => {
  const words = String(text || '').trim().split(' ');
  if (words.length < 2) return <em>{text}</em>;
  const last = words.pop();
  return <>{words.join(' ')} <em>{last}</em></>;
};
