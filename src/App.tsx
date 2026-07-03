/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SplineSceneBasic } from './demo';
import { Spotlight } from '@/components/ui/spotlight';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      <Spotlight className="from-white/20 via-white/5 to-transparent z-10" size={500} />
      <SplineSceneBasic />
    </div>
  );
}
