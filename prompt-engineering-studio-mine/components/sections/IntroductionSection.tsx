
import React from 'react';
import { Card } from '../Card';
import { introductionContent, understandingPromptsContent } from '../../constants/promptData';
import type { ContentBlock } from '../../types';
import { AccordionItem } from '../Accordion';


const renderContentNode = (node: string | React.ReactNode): React.ReactNode => {
  if (typeof node === 'string') {
    return node.split('\n').map((line, index) => <p key={index}>{line}</p>);
  }
  return node; // If it's already a ReactNode, return it as is.
};

export const IntroductionSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <header className="pb-6 border-b border-gray-700">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          {introductionContent.title}
        </h1>
        {introductionContent.description && 
          <div className="mt-3 text-lg text-gray-400 space-y-2">
            {renderContentNode(introductionContent.description)}
          </div>
        }
      </header>
      
      <Card title={understandingPromptsContent.title} className="bg-gray-850">
        {understandingPromptsContent.description && <div className="text-gray-300 mb-4 space-y-2">{renderContentNode(understandingPromptsContent.description)}</div>}
        <div className="space-y-4">
          {understandingPromptsContent.subItems?.map((item: ContentBlock) => (
            <AccordionItem key={item.id} title={item.title}>
              {item.details && <div className="text-sm text-gray-400 space-y-2">{renderContentNode(item.details)}</div>}
            </AccordionItem>
          ))}
        </div>
      </Card>
    </div>
  );
};
