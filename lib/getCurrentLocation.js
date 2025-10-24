// utils/getCurrentLocation.js

/**
 * Fetches the user's current location and returns detailed address info.
 * Works only in browser (client-side).
 *
 * @returns {Promise<{
 *   latitude: number,
 *   longitude: number,
 *   town: string | null,
 *   area: string | null,
 *   city: string | null,
 *   province: string | null,
 *   country: string | null,
 *   formatted_address: string | null
 * }>}
 */
export async function getCurrentLocation() {
  if (typeof window === "undefined") {
    throw new Error("getCurrentLocation() must be run client-side");
  }

  // Step 1: Get GPS coordinates
  const coords = await new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve({ latitude, longitude });
      },
      (err) => reject(new Error(`Location error: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  const { latitude, longitude } = coords;

  // Step 2: Reverse-geocode using Google API
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    throw new Error("Missing Google Maps API key");
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
  );

  const data = await res.json();
  if (data.status !== "OK") {
    throw new Error(`Google Geocoding failed: ${data.status}`);
  }

  const result = data.results[0];
  const components = result.address_components;

  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || null;

  const location = {
    latitude,
    longitude,
    town: get("sublocality") || get("neighborhood"),
    area: get("locality") || get("administrative_area_level_2"),
    city: get("administrative_area_level_2") || get("locality"),
    province: get("administrative_area_level_1"),
    country: get("country"),
    formatted_address: result.formatted_address || null,
  };

  return location;
}
