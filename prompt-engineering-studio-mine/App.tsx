import React, { useState, useCallback } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { IntroductionSection }
  from './components/sections/IntroductionSection';
import { PromptTypesSection }
  from './components/sections/PromptTypesSection';
import { UseCasesSection }
  from './components/sections/UseCasesSection';
import { StrategiesSection }
  from './components/sections/StrategiesSection';
import { PlaygroundSection }
  from './components/sections/PlaygroundSection';
import { PromptLibrarySection } from './components/sections/PromptLibrarySection';
import {
  BookOpenIcon,
  LightBulbIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  RectangleStackIcon,
} from './components/Icons';

enum Section {
  Introduction = 'Introduction',
  PromptTypes = 'Prompt Types',
  UseCases = 'Use Cases',
  Strategies = 'Strategies',
  PromptLibrary = 'Prompt Library',
  Playground = 'Playground',
}

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(
    Section.Introduction
  );
  const [playgroundInitialPrompt, setPlaygroundInitialPrompt] = useState<string>('');

  const handleUseTemplate = useCallback((template: string) => {
    setPlaygroundInitialPrompt(template);
    setActiveSection(Section.Playground);
  }, []);

  const navItems: NavItem[] = [
    {
      name: Section.Introduction,
      icon: <BookOpenIcon className="w-5 h-5 mr-3" />,
    },
    {
      name: Section.PromptTypes,
      icon: <LightBulbIcon className="w-5 h-5 mr-3" />,
    },
    { name: Section.UseCases, icon: <BeakerIcon className="w-5 h-5 mr-3" /> },
    {
      name: Section.Strategies,
      icon: <WrenchScrewdriverIcon className="w-5 h-5 mr-3" />,
    },
    {
      name: Section.PromptLibrary,
      icon: <RectangleStackIcon className="w-5 h-5 mr-3" />,
    },
    {
      name: Section.Playground,
      icon: <SparklesIcon className="w-5 h-5 mr-3" />,
    },
  ];

  const renderSection = useCallback(() => {
    switch (activeSection) {
      case Section.Introduction:
        return <IntroductionSection />;
      case Section.PromptTypes:
        return <PromptTypesSection />;
      case Section.UseCases:
        return <UseCasesSection />;
      case Section.Strategies:
        return <StrategiesSection />;
      case Section.PromptLibrary:
        return <PromptLibrarySection onUseTemplate={handleUseTemplate} />;
      case Section.Playground:
        return <PlaygroundSection 
                  key={playgroundInitialPrompt} // Force re-mount if prompt changes
                  initialPrompt={playgroundInitialPrompt} 
                  onPromptUsed={() => setPlaygroundInitialPrompt('')} 
               />;
      default:
        return <IntroductionSection />;
    }
  }, [activeSection, playgroundInitialPrompt, handleUseTemplate]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar
        navItems={navItems}
        activeItem={activeSection}
        onNavItemClick={(item) => setActiveSection(item as Section)}
      />
      <main className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto">
        {renderSection()}
      </main>
    </div>
  );
};

export default App;
