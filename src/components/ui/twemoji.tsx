import React from 'react';
import twemoji from '@twemoji/api';
import sanitizeHtml from 'sanitize-html';
import { cva } from 'styled-system/css';

export interface TwemojiProps {
  emoji: string;
  className?: string;
}

const twemojiStyle = cva({
  base: {
    display: 'inline-block',
    '& img': {
      display: 'inline-block',
      width: '1em',
      height: '1em',
      margin: '0 0.05em 0 0.1em',
      verticalAlign: '-0.1em'
    }
  }
});

export const Twemoji: React.FC<TwemojiProps> = ({ emoji, className }) => {
  const parsed = twemoji.parse(emoji, {
    folder: 'svg',
    ext: '.svg',
    className: 'twemoji'
  });

  const clean = sanitizeHtml(parsed, {
    allowedTags: ['img'],
    allowedAttributes: {
      img: ['src', 'alt', 'class', 'draggable']
    },
    allowedClasses: {
      img: ['twemoji']
    }
  });

  return (
    <span
      className={`${twemojiStyle()} ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};
