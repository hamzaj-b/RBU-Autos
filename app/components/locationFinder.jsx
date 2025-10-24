import { useEffect, useState } from "react";

const ReverseGeocoder = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
  });

  const fetchAddress = async ({ latitude, longitude }) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setLocation((prev) => ({ ...prev, address: data.display_name }));
      } else {
        setLocation((prev) => ({ ...prev, error: "Unable to fetch address" }));
      }
    } catch (err) {
      setLocation((prev) => ({ ...prev, error: err.message }));
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          setLocation({ latitude, longitude, address: null, error: null });
          fetchAddress({ latitude, longitude });
        },
        (error) => {
          setLocation({
            latitude: null,
            longitude: null,
            address: null,
            error: error.message,
          });
        }
      );
    } else {
      setLocation({
        latitude: null,
        longitude: null,
        address: null,
        error: "Geolocation is not supported by this browser.",
      });
    }
  }, []);

  if (location.error) {
    return (
      <div>
        <h1>Reverse Geocoder</h1>
        <p>Error: {location.error}</p>
      </div>
    );
  }

  if (!location.latitude || !location.longitude) {
    return (
      <div>
        <h1>Reverse Geocoder</h1>
        <p>Fetching location...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Reverse Geocoder</h1>
      <p>Your current location:</p>
      <p>Latitude: {location.latitude}</p>
      <p>Longitude: {location.longitude}</p>
      {location.address ? (
        <p>Address: {location.address}</p>
      ) : (
        <p>Fetching address...</p>
      )}
    </div>
  );
};

export default ReverseGeocoder;
