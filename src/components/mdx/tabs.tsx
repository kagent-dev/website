'use client'
import React, { useState, useEffect } from 'react';



interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, className = '' }) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabContents, setTabContents] = useState<Record<string, HTMLElement | null>>({});

  // Find and get the content elements after component mounts
  useEffect(() => {
    if (tabs.length === 0) return;
    
    const initialTab = defaultTab || tabs[0]?.id || '';
    setActiveTab(initialTab);
    
    const contents: Record<string, HTMLElement | null> = {};
    
    tabs.forEach(tab => {
      const element = document.getElementById(`${tab.id}-tab`);
      contents[tab.id] = element;
      
      // Hide all tab content divs at the start
      if (element) {
        element.style.display = tab.id === initialTab ? 'block' : 'none';
      }
    });
    
    setTabContents(contents);
  }, [tabs, defaultTab]);
  
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


