import React from 'react';

const SectionHeader = ({ children }) => {
  return (
    <h2 className="text-[13px] font-semibold uppercase tracking-wide opacity-40 mb-3">
      {children}
    </h2>
  );
};

export default SectionHeader;
