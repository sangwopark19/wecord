'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SidePanel({ open, onClose, title, children }: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 h-full w-[480px] border-l transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: '#1A1A1A',
          borderColor: '#2B2B2B',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: '#2B2B2B' }}
        >
          <h2 className="text-[20px] font-semibold leading-[1.2]">{title}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Panel
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ height: 'calc(100% - 65px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
