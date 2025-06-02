'use client';

import React from 'react';

const AboutKagent = () => {
  return (
    <div>
      <p className="text-lg leading-relaxed mb-12">
        Kagent is built on three key layers: Tools, Agents, and the Framework. Tools are pre-defined functions that AI agents can use, such as sending emails, searching databases, displaying pod logs, or calling external APIs. Agents are autonomous systems capable of planning, executing tasks, analyzing results, and continuously improving outcomes, while the Framework provides a simple interface to run agents via UI or declaratively.
      </p>
      
      <p className="text-lg">
        The framework is fully extensible, allowing users to develop new tools or agents, or extend the framework itself. Kagent has a few agents already, solving common cloud native operation problems for some of our most popular graduated projects such as Kubernetes, Prometheus, Istio, and Argo.
      </p>
    </div>
  );
};

export default AboutKagent; 