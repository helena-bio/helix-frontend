'use client';

import React from 'react';
import { HelixLoader } from './helix-loader';
import { LoadingState } from './loading-state';

export const HelixTest = () => {
  return (
    <div className="p-8 space-y-12">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">HelixLoader Sizes</h2>
        <div className="flex items-end gap-8">
          <div className="text-center">
            <HelixLoader size="sm" />
            <p className="mt-2 text-sm">Small</p>
          </div>
          <div className="text-center">
            <HelixLoader size="md" />
            <p className="mt-2 text-sm">Medium</p>
          </div>
          <div className="text-center">
            <HelixLoader size="lg" />
            <p className="mt-2 text-sm">Large</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">LoadingState Examples</h2>
        <div className="border rounded-lg p-4">
          <LoadingState message="Analyzing variants..." size="md" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Different Speeds</h2>
        <div className="flex items-end gap-8">
          <div className="text-center">
            <HelixLoader speed={1} />
            <p className="mt-2 text-sm">Fast (1s)</p>
          </div>
          <div className="text-center">
            <HelixLoader speed={3} />
            <p className="mt-2 text-sm">Normal (3s)</p>
          </div>
          <div className="text-center">
            <HelixLoader speed={6} />
            <p className="mt-2 text-sm">Slow (6s)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
