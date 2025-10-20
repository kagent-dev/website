'use client'
import React, { useState, useEffect } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface GenericTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  tabSuffix?: string;
}

export const GenericTabs: React.FC<GenericTabsProps> = ({ 
  tabs, 
  defaultTab, 
  className = '',
  tabSuffix = '-tab'
}) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabContents, setTabContents] = useState<Record<string, HTMLElement | null>>({});

  // Find and get the content elements after component mounts
  useEffect(() => {
    if (tabs.length === 0) return;
    
    const initialTab = defaultTab || tabs[0]?.id || '';
    setActiveTab(initialTab);
    
    const contents: Record<string, HTMLElement | null> = {};
    
    tabs.forEach(tab => {
      const element = document.getElementById(`${tab.id}${tabSuffix}`);
      contents[tab.id] = element;
      
      // Hide all tab content divs at the start
      if (element) {
        element.style.display = tab.id === initialTab ? 'block' : 'none';
      }
    });
    
    setTabContents(contents);
  }, [tabs, defaultTab, tabSuffix]);
  
  // Handle tab switching
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Update display for each content div
    tabs.forEach(tab => {
      const content = tabContents[tab.id];
      if (content) {
        content.style.display = tab.id === tabId ? 'block' : 'none';
      }
    });
  };

  if (tabs.length === 0) return null;

  return (
    <div className={`w-full mb-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface PlatformTabsProps {
  children?: React.ReactNode;
}

export const PlatformTabs: React.FC<PlatformTabsProps> = () => {
  const platformTabs = [
    { id: 'mac', label: 'macOS' },
    { id: 'windows', label: 'Windows' },
    { id: 'linux', label: 'Linux' }
  ];

  return <GenericTabs tabs={platformTabs} defaultTab="mac" />;
};

// LLM Provider tabs component as an example
interface LLMProviderTabsProps {
  providers?: Array<{ id: string; label: string }>;
  defaultProvider?: string;
}

export const LLMProviderTabs: React.FC<LLMProviderTabsProps> = ({ 
  providers, 
  defaultProvider 
}) => {
  const defaultProviders = [
    { id: 'openai', label: 'OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'gemini', label: 'Gemini' },
    { id: 'azure', label: 'Azure OpenAI' },
    { id: 'ollama', label: 'Ollama' }
  ];

  const tabs = providers || defaultProviders;

  return <GenericTabs tabs={tabs} defaultTab={defaultProvider || tabs[0]?.id} />;
};