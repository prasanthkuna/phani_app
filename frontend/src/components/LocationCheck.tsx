import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { getCurrentLocation } from '../services/location';

interface LocationCheckProps {
  onLocationGranted: () => void;
}

export const LocationCheck: React.FC<LocationCheckProps> = ({ onLocationGranted }) => {
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkLocation = async () => {
      try {
        console.log('Checking location permission...');
        setChecking(true);
        setError(null);
        const location = await getCurrentLocation(); // This will throw an error if location access is denied
        console.log('Location permission granted, data:', location);
        onLocationGranted();
      } catch (error) {
        console.error('Location check error:', error);
        setError(error instanceof Error ? error.message : 'Failed to get location access');
      } finally {
        setChecking(false);
      }
    };

    checkLocation();
  }, [onLocationGranted]);

  if (checking) {
    return (
      <Alert>
        <AlertDescription>Checking location access...</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
}; 