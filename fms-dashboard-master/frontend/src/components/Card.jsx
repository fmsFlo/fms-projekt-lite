import React from 'react';

// Simple className merge function
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Card = ({ className, children, title }) => {
  return (
    <div className={cn(
      "bg-[#1a1f2e] border border-white/5 rounded-lg p-5",
      className
    )}>
      {title && (
        <h3 className="text-[13px] font-semibold uppercase tracking-wide opacity-60 mb-3 pb-3 border-b border-white/5">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
