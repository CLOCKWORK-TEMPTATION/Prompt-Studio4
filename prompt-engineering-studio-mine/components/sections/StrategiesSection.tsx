
import React from 'react';
import { SectionPage } from './SectionPage';
import { strategiesContent, furtherGuidanceContent } from '../../constants/promptData';

export const StrategiesSection: React.FC = () => {
  return (
    <SectionPage
      title="Strategies for Writing Better Prompts"
      introduction="Developing effective prompts requires a strategic approach. Consider these tactics to enhance your prompt engineering skills and achieve superior AI outputs."
      contentBlocks={[...strategiesContent, furtherGuidanceContent]}
      layout="accordion"
    />
  );
};
