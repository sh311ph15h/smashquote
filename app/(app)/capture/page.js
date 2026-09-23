import { isR2Configured } from '@/lib/r2';
import { recentVehicles } from '@/app/actions/vehicles';
import { isValidCategory } from '@/lib/photos';
import CaptureFlow from './CaptureFlow';

// The shop-floor entry point. Everything here is driven off the rego, because
// standing next to a car that's the only thing you know about it — the quote
// number is on a screen in the office.
export default async function CapturePage({ searchParams }) {
  const sp = await searchParams;
  const configured = isR2Configured();
  // Pre-seeded from the "Add invoice" button, so that path skips a step.
  const presetType = isValidCategory(sp.type) ? sp.type : null;

  const { vehicles = [] } = configured ? await recentVehicles() : {};

  return (
    <CaptureFlow
      initialVehicles={vehicles}
      presetType={presetType}
      configured={configured}
    />
  );
}
