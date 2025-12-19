import { Geolocation } from '@capacitor/geolocation';

// Omega Products facility location
const FACILITY_LOCATION = {
  latitude: 33.8753,  // Replace with actual coordinates
  longitude: -117.5664
};

const MAX_DISTANCE_MILES = 10; // 10 minute drive radius

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function checkUserLocation() {
  try {
    // Request permissions
    const permission = await Geolocation.requestPermissions();
    
    if (permission.location !== 'granted') {
      return { 
        isNearFacility: false, 
        error: 'Location permission denied' 
      };
    }

    // Get current position
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });

    const { latitude, longitude } = position.coords;
    
    // Calculate distance to facility
    const distance = calculateDistance(
      latitude,
      longitude,
      FACILITY_LOCATION.latitude,
      FACILITY_LOCATION.longitude
    );

    return {
      isNearFacility: distance <= MAX_DISTANCE_MILES,
      distance: distance.toFixed(2),
      userLocation: { latitude, longitude }
    };
    
  } catch (error) {
    console.error('Location error:', error);
    return { 
      isNearFacility: false, 
      error: error.message 
    };
  }
}

// Watch location changes (for monitoring if user leaves area)
export async function watchUserLocation(callback) {
  const watchId = await Geolocation.watchPosition(
    { enableHighAccuracy: true },
    (position, err) => {
      if (err) {
        callback({ error: err.message });
        return;
      }
      
      const { latitude, longitude } = position.coords;
      const distance = calculateDistance(
        latitude,
        longitude,
        FACILITY_LOCATION.latitude,
        FACILITY_LOCATION.longitude
      );
      
      callback({
        isNearFacility: distance <= MAX_DISTANCE_MILES,
        distance: distance.toFixed(2),
        userLocation: { latitude, longitude }
      });
    }
  );
  
  return watchId;
}

export async function stopWatchingLocation(watchId) {
  await Geolocation.clearWatch({ id: watchId });
}