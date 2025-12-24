
import React from 'react';
import { SectionPage } from './SectionPage';
import { promptTypesContent } from '../../constants/promptData';

export const PromptTypesSection: React.FC = () => {
  return (
    <SectionPage
      title="Understanding Prompt Types"
      introduction="There are various types of prompts used in AI, each serving a specific purpose. Mastering these types allows for more nuanced control over AI responses."
      contentBlocks={promptTypesContent}
      layout="accordion"
    />
  );
};
