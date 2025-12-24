
import React from 'react';
import type { ContentBlock } from '../../types';
import { AccordionItem } from '../Accordion';
import { Card } from '../Card';

interface SectionPageProps {
  title: string;
  introduction?: string | React.ReactNode;
  contentBlocks: ContentBlock[];
  layout?: 'accordion' | 'cards';
}

const renderContentNode = (node: string | React.ReactNode): React.ReactNode => {
  if (typeof node === 'string') {
    // Basic handling for newlines in string, or markdown-like formatting
    return node.split('\n').map((line, index) => {
      // Handle potential empty lines or lines that are just whitespace
      if (line.trim() === '') {
        return <br key={index} />; // Or null, or an empty paragraph, depending on desired spacing
      }
      const isCodeLine = line.startsWith('`') && line.endsWith('`');
      const content = isCodeLine ? line.substring(1, line.length - 1) : line; // Remove backticks for code line

      // Check if the line is part of a ``` code block
      // This simple check assumes code blocks aren't nested and ``` are at line start/end.
      // A more robust markdown parser would be needed for complex markdown.
      if (line.startsWith('```') && line.length > 3) { // Start of a code block with language
        return <p key={index} className="font-mono bg-gray-700 p-1 rounded text-sm">{line.substring(3)}</p>;
      }
      if (line.startsWith('```') || line.endsWith('```')) { // Code block fence or content
         // For lines within a pre/code block, <p> might not be ideal.
         // However, examplePrompts are already wrapped in pre/code.
         // This part primarily affects `details` or `description` strings.
        return <span key={index} className="block">{content}</span>; // Using span with block for line breaks
      }

      return (
        <p key={index} className={isCodeLine ? 'font-mono bg-gray-700 p-1 rounded text-sm' : ''}>
          {content}
        </p>
      );
    });
  }
  return node; // If it's already a ReactNode, return it as is.
};


export const SectionPage: React.FC<SectionPageProps> = ({ title, introduction, contentBlocks, layout = 'accordion' }) => {
  return (
    <div className="space-y-8">
      <header className="pb-6 border-b border-gray-700">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          {title}
        </h1>
        {introduction && <div className="mt-3 text-lg text-gray-400 space-y-2">{renderContentNode(introduction)}</div>}
      </header>

      <div className={`space-y-${layout === 'accordion' ? '4' : '6'}`}>
        {contentBlocks.map((block) => (
          layout === 'accordion' ? (
            <AccordionItem key={block.id} title={block.title} initiallyOpen={block.id === contentBlocks[0].id}>
              {block.description && <div className="mb-3 text-gray-300 space-y-2">{renderContentNode(block.description)}</div>}
              {block.details && <div className="mb-3 text-sm text-gray-400 space-y-2">{renderContentNode(block.details)}</div>}
              {block.examplePrompt && (
                <div className="mt-3">
                  <p className="font-semibold text-blue-300 mb-1">Example Prompt:</p>
                  <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    <code>{typeof block.examplePrompt === 'string' ? block.examplePrompt : renderContentNode(block.examplePrompt)}</code>
                  </pre>
                </div>
              )}
              {block.subItems && block.subItems.length > 0 && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-600">
                  {block.subItems.map(subItem => (
                     <div key={subItem.id}>
                        <h5 className="font-semibold text-blue-300">{subItem.title}</h5>
                        {subItem.details && <div className="text-sm text-gray-400 mt-1 mb-2 space-y-1">{renderContentNode(subItem.details)}</div>}
                        {subItem.examplePrompt && (
                           <pre className="bg-gray-850 p-2 rounded-md text-xs text-gray-300 overflow-x-auto mt-1 whitespace-pre-wrap">
                             <code>{typeof subItem.examplePrompt === 'string' ? subItem.examplePrompt : renderContentNode(subItem.examplePrompt)}</code>
                           </pre>
                        )}
                     </div>
                  ))}
                </div>
              )}
            </AccordionItem>
          ) : (
            <Card key={block.id} title={block.title} className="bg-gray-850">
              {block.description && <div className="mb-3 space-y-2">{renderContentNode(block.description)}</div>}
              {block.details && <div className="mb-3 text-sm text-gray-400 space-y-2">{renderContentNode(block.details)}</div>}
              {block.examplePrompt && (
                <div className="mt-3">
                  <p className="font-semibold text-blue-300 mb-1">Example Prompt:</p>
                  <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    <code>{typeof block.examplePrompt === 'string' ? block.examplePrompt : renderContentNode(block.examplePrompt)}</code>
                  </pre>
                </div>
              )}
               {block.subItems && block.subItems.length > 0 && (
                <div className="mt-4 space-y-3">
                  {block.subItems.map(subItem => (
                     <AccordionItem key={subItem.id} title={subItem.title}>
                        {subItem.details && <div className="text-sm text-gray-400 mt-1 mb-2 space-y-1">{renderContentNode(subItem.details)}</div>}
                        {subItem.examplePrompt && (
                           <pre className="bg-gray-800 p-2 rounded-md text-xs text-gray-300 overflow-x-auto mt-1 whitespace-pre-wrap">
                             <code>{typeof subItem.examplePrompt === 'string' ? subItem.examplePrompt : renderContentNode(subItem.examplePrompt)}</code>
                           </pre>
                        )}
                     </AccordionItem>
                  ))}
                </div>
              )}
            </Card>
          )
        ))}
      </div>
    </div>
  );
};
