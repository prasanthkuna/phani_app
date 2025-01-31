export interface LocationData {
  state: string;
  display_name: string;
  latitude: number;
  longitude: number;
}

export const checkLocationPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'prompt';
  }
};

export const getCurrentLocation = async (): Promise<LocationData> => {
  try {
    // Check permission state first
    const permissionState = await checkLocationPermission();
    if (permissionState === 'denied') {
      throw new Error('Location permission was denied. Please enable location access in your browser settings and refresh the page.');
    }

    // Get coordinates
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });

    // Use reverse geocoding to get address details
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get location details');
    }

    const data = await response.json();
    console.log('Location data from API:', data);

    // Extract required fields with fallbacks
    const state = data.address?.state || 'Unknown';
    const display_name = data.display_name || 'Unknown';

    // Ensure we have all required data
    if (state === 'Unknown') {
      console.error('Missing location data:', { state, display_name });
      throw new Error('Could not determine complete location information. Please try again or contact support.');
    }

    // Format latitude and longitude to have max 9 digits total (including decimal point)
    // This means 3 digits before decimal and 5 after for a total of 9 digits
    const formatCoordinate = (coord: number): number => {
      // Convert to string with fixed decimal places (5)
      const formatted = coord.toFixed(5);
      // Parse back to number
      return Number(formatted);
    };

    return {
      state,
      display_name,
      latitude: formatCoordinate(Number(data.lat)),
      longitude: formatCoordinate(Number(data.lon))
    };
  } catch (error) {
    console.error('Error getting location:', error);
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          throw new Error(
            'Location access was denied. To enable: \n' +
            '1. Click the lock/info icon in your browser\'s address bar\n' +
            '2. Find "Location" or "Site Settings"\n' +
            '3. Allow location access\n' +
            '4. Refresh the page'
          );
        case error.POSITION_UNAVAILABLE:
          throw new Error('Location information is unavailable. Please try again.');
        case error.TIMEOUT:
          throw new Error('Location request timed out. Please check your connection and try again.');
        default:
          throw new Error('Failed to get location. Please try again.');
      }
    }
    throw error;
  }
}; 