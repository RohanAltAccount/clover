import { useState } from 'react';
import { Text, useSpatialInput } from 'mrbd-ui-kit';
import { MapPin } from 'lucide-react';
import { FrostedCard } from '../components/FrostedCard';
import { useGeolocation } from '../hooks/useGeolocation';

/**
 * Demonstrates three Display-specific building blocks at once:
 * - useGeolocation() for the device position,
 * - <FrostedCard> for a glanceable info panel,
 * - useSpatialInput() to handle temple-touch / D-pad keys directly
 *   (here: a tap/Select bumps a counter).
 */
export function LocationScreen() {
  const { coords, error } = useGeolocation();
  const [pings, setPings] = useState(0);

  useSpatialInput({
    onPress: (key) => {
      if (key === 'select') setPings((p) => p + 1);
    },
  });

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-4">
      <FrostedCard>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-sky-300" />
          <Text size="lg" weight="bold">
            Your location
          </Text>
        </div>

        {coords ? (
          <Text className="mt-1 block text-white/90">
            {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
          </Text>
        ) : (
          <Text className="mt-1 block text-gray-400">
            {error ? 'Location unavailable' : 'Locating…'}
          </Text>
        )}

        <Text size="sm" className="mt-2 block text-white/50">
          Tap (Select) to ping · {pings}
        </Text>
      </FrostedCard>
    </div>
  );
}
