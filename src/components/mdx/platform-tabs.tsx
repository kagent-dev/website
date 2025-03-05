'use client'
import React, { useState, useEffect } from 'react';

type Platform = 'mac' | 'windows' | 'linux';

interface PlatformTabsProps {
  children?: React.ReactNode;
}

export const PlatformTabs: React.FC<PlatformTabsProps> = () => {
  const [activeTab, setActiveTab] = useState<Platform>('mac');
  const [macContent, setMacContent] = useState<HTMLElement | null>(null);
  const [windowsContent, setWindowsContent] = useState<HTMLElement | null>(null);
  const [linuxContent, setLinuxContent] = useState<HTMLElement | null>(null);
  
  const platforms = [
    { id: 'mac' as Platform, label: 'macOS' },
    { id: 'windows' as Platform, label: 'Windows' },
    { id: 'linux' as Platform, label: 'Linux' }
  ];

  // Find and get the content elements after component mounts
  useEffect(() => {
    const macElement = document.getElementById('mac-tab');
    const windowsElement = document.getElementById('windows-tab');
    const linuxElement = document.getElementById('linux-tab');
    
    if (macElement) setMacContent(macElement);
    if (windowsElement) setWindowsContent(windowsElement);
    if (linuxElement) setLinuxContent(linuxElement);
    
    // Hide all tab content divs at the start
    if (macElement) macElement.style.display = activeTab === 'mac' ? 'block' : 'none';
    if (windowsElement) windowsElement.style.display = activeTab === 'windows' ? 'block' : 'none';
    if (linuxElement) linuxElement.style.display = activeTab === 'linux' ? 'block' : 'none';
  }, [activeTab]);
  
  // Handle tab switching
  const handleTabChange = (platform: Platform) => {
    setActiveTab(platform);
    
    // Update display for each content div
    if (macContent) macContent.style.display = platform === 'mac' ? 'block' : 'none';
    if (windowsContent) windowsContent.style.display = platform === 'windows' ? 'block' : 'none';
    if (linuxContent) linuxContent.style.display = platform === 'linux' ? 'block' : 'none';
  };

  return (
    <div className="w-full mb-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handleTabChange(platform.id)}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === platform.id
                ? 'text-violet-600 border-b-2 violet-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {platform.label}
          </button>
        ))}
      </div>
    </div>
  );
};