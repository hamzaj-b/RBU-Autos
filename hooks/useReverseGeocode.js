import { useEffect, useState } from "react";

export default function useReverseGeocode() {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
    loading: true,
  });

  const fetchAddress = async ({ latitude, longitude }) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data?.display_name) {
        setLocation((prev) => ({
          ...prev,
          address: data.display_name,
          loading: false,
        }));
      } else {
        setLocation((prev) => ({
          ...prev,
          error: "Unable to fetch address",
          loading: false,
        }));
      }
    } catch (err) {
      setLocation((prev) => ({ ...prev, error: err.message, loading: false }));
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;

          setLocation({
            latitude,
            longitude,
            address: null,
            error: null,
            loading: true,
          });

          fetchAddress({ latitude, longitude });
        },
        (error) => {
          setLocation({
            latitude: null,
            longitude: null,
            address: null,
            error: error.message,
            loading: false,
          });
        }
      );
    } else {
      setLocation({
        latitude: null,
        longitude: null,
        address: null,
        error: "Geolocation not supported",
        loading: false,
      });
    }
  }, []);

  return location;
}
