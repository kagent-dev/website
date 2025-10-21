'use client';

import React from "react";
import { ChevronDown } from "lucide-react";

const KubeConAnnouncementBar = () => {
  const scrollToAnnouncement = () => {
    const element = document.getElementById('kubecon-announcement');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-violet-600/50 via-purple-600/80 to-indigo-600/50 text-white py-3 px-4 shadow-lg relative overflow-hidden">
      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div
          className="w-full text-center cursor-pointer transition-all duration-300 hover:opacity-90"
          onClick={scrollToAnnouncement}
        >
          <div className="flex items-center justify-center space-x-2 text-sm font-medium">
            <span className="drop-shadow-sm">
              🎉 Join us at the MCP and Agents Community Party at KubeCon Atlanta on Nov 12
            </span>
            <ChevronDown className="w-4 h-4 drop-shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KubeConAnnouncementBar;
