import React, { useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  tagName?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'li';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  ariaLabel?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  tagName = 'span',
  className = '',
  style,
  placeholder = 'Click to edit...',
  ariaLabel,
}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (elementRef.current && !isFocusedRef.current) {
      if (elementRef.current.innerText !== value) {
        elementRef.current.innerText = value;
      }
    }
  }, [value]);

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (elementRef.current) {
      const nextText = elementRef.current.innerText.trim();
      if (nextText !== value) {
        onChange(nextText);
      }
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && tagName !== 'p' && tagName !== 'div') {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  const Tag = tagName as any;

  return (
    <Tag
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel || placeholder}
      title="Click to edit inline"
      className={`${className} ${!value ? 'opacity-60 italic' : ''}`}
      style={style}
    >
      {value || placeholder}
    </Tag>
  );
};
