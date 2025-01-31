import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

interface LocationCheckProps {
  onLocationGranted: (granted: boolean) => void;
  showSuccessMessage?: boolean;
}

export const LocationCheck: React.FC<LocationCheckProps> = ({ 
  onLocationGranted,
  showSuccessMessage = false 
}) => {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [hasShownSuccess, setHasShownSuccess] = useState(false);

  const checkLocation = async () => {
    setChecking(true);
    setError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      onLocationGranted(true);
      if (showSuccessMessage && !hasShownSuccess) {
        toast({
          title: 'Location Access Granted',
          description: 'You can now place orders.',
          variant: 'success',
        });
        setHasShownSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof GeolocationPositionError 
        ? getLocationErrorMessage(err)
        : 'Failed to get location. Please enable location access and try again.';
      
      setError(errorMessage);
      onLocationGranted(false);
      toast({
        title: 'Location Access Required',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access was denied. Please enable location access in your browser settings.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Please try again.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  };

  useEffect(() => {
    checkLocation();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex justify-between items-center">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={checkLocation} disabled={checking}>
            {checking ? 'Checking...' : 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}; 