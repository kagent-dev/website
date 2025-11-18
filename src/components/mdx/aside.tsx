import React from 'react';
import { Info, AlertTriangle, Lightbulb, AlertCircle } from 'lucide-react';

interface AsideProps {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  children: React.ReactNode;
}

const asideStyles = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    IconComponent: Info,
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    IconComponent: AlertTriangle,
  },
  tip: {
    container: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    IconComponent: Lightbulb,
  },
  danger: {
    container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    IconComponent: AlertCircle,
  },
};

export function Aside({ type = 'info', children }: AsideProps) {
  const style = asideStyles[type];
  const IconComponent = style.IconComponent;

  return (
    <aside className={`my-6 rounded-lg border-l-4 p-4 ${style.container}`}>
      <div className="flex gap-3 items-center">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${style.icon}`} />
        </div>
        <div className="flex-1 leading-7 text-muted-foreground">
          {children}
        </div>
      </div>
    </aside>
  );
}

