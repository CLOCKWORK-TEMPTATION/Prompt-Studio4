import React, { useState, useCallback } from 'react';
import type { PromptTemplate } from '../../types';
import { promptTemplateCategories } from '../../constants/promptTemplates';
import { AccordionItem } from '../Accordion';
import { Card } from '../Card';
import { ClipboardIcon, CheckIcon, ArrowUpRightIcon } from '../Icons';


const TemplateCard: React.FC<{ template: PromptTemplate; onUseTemplate: (template: string) => void; }> = ({ template, onUseTemplate }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(template.template).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, [template.template]);

    return (
        <Card title={template.title} className="bg-gray-850 flex flex-col">
           <div className="flex-grow">
                <p className="text-sm text-gray-400 italic mb-3 ">{template.useCase}</p>
                <p className="text-sm text-gray-300 mb-4">{template.description}</p>
                
                <div className="mb-4">
                    <p className="text-sm font-semibold text-blue-300 mb-2">Customizable Variables:</p>
                    <ul className="space-y-1.5 text-xs text-gray-400 list-disc list-inside">
                        {template.variables.map(v => (
                           <li key={v.name}><code className="bg-gray-700 px-1 py-0.5 rounded text-blue-300">{v.name}</code>: {v.description}</li>
                        ))}
                    </ul>
                </div>

                <div className="relative">
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-white transition-colors"
                        title="Copy Template"
                        aria-label="Copy prompt template to clipboard"
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                    </button>
                    <pre className="whitespace-pre-wrap p-3 bg-gray-900 rounded-md text-gray-200 text-xs overflow-x-auto">
                        <code>{template.template}</code>
                    </pre>
                </div>
           </div>
            <div className="mt-4">
                <button 
                    onClick={() => onUseTemplate(template.template)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                >
                    Use in Playground
                    <ArrowUpRightIcon className="w-4 h-4" />
                </button>
            </div>
        </Card>
    )
}


export const PromptLibrarySection: React.FC<{onUseTemplate: (template: string) => void}> = ({ onUseTemplate }) => {
  return (
    <div className="space-y-8">
      <header className="pb-6 border-b border-gray-700">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Prompt Template Library
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          A curated collection of high-quality, structured prompt templates to kickstart your tasks. Choose a template, customize the variables, and get superior results from the AI.
        </p>
      </header>

      <div className="space-y-4">
        {promptTemplateCategories.map((category, index) => (
          <AccordionItem key={category.id} title={category.name} initiallyOpen={index === 0}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
              {category.templates.map(template => (
                <TemplateCard key={template.title} template={template} onUseTemplate={onUseTemplate}/>
              ))}
            </div>
          </AccordionItem>
        ))}
      </div>
    </div>
  );
};
