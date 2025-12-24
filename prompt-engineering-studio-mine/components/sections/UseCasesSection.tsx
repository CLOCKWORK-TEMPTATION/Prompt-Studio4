
import React from 'react';
import { SectionPage } from './SectionPage';
import { useCasesContent } from '../../constants/promptData';

export const UseCasesSection: React.FC = () => {
  return (
    <SectionPage
      title="Prompt Engineering Use Cases & Examples"
      introduction="Explore specific examples and scenarios demonstrating how prompt engineering helps produce customized and relevant AI outputs across various domains."
      contentBlocks={useCasesContent}
      layout="accordion" 
    />
  );
};
