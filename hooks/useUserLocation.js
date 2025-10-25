"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useUserLocation(autoFetch = true) {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
    loading: autoFetch,
  });

  const [isValid, setIsValid] = useState(false);
  const listenersRef = useRef([]);

  const debugLog = (...args) => console.log("📍 useUserLocation:", ...args);
  const notifyListeners = (loc) => {
    listenersRef.current.forEach((resolve) => resolve(loc));
    listenersRef.current = [];
  };
  const waitForNextUpdate = () =>
    new Promise((resolve) => listenersRef.current.push(resolve));

  const fetchAddress = async ({ latitude, longitude }) => {
    // debugLog("🧭 Fetching address for:", latitude, longitude);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      const address = data?.display_name || null;
      const newLoc = {
        latitude,
        longitude,
        address,
        error: null,
        loading: false,
      };
    //   debugLog(address ? "✅ Address resolved:" : "⚠️ No address:", address);
      setLocation(newLoc);
      setIsValid(Boolean(address && latitude && longitude));
      notifyListeners(newLoc);
    } catch (err) {
      const newLoc = {
        latitude,
        longitude,
        address: null,
        error: err.message,
        loading: false,
      };
    //   debugLog("💥 Error fetching address:", err.message);
      setLocation(newLoc);
      setIsValid(false);
      notifyListeners(newLoc);
    }
  };

  const getUserLocation = useCallback(() => {
    debugLog("📡 getUserLocation() called...");

    if (!("geolocation" in navigator)) {
      const errLoc = {
        latitude: null,
        longitude: null,
        address: null,
        error: "Geolocation not supported",
        loading: false,
      };
      debugLog("❌ Geolocation not supported");
      setLocation(errLoc);
      notifyListeners(errLoc);
      return;
    }

    setLocation((p) => ({ ...p, loading: true }));

    let successHandled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        successHandled = true;
        const { latitude, longitude } = pos.coords;
        debugLog("✅ Coordinates received:", latitude, longitude);
        setLocation({
          latitude,
          longitude,
          address: null,
          error: null,
          loading: true,
        });
        fetchAddress({ latitude, longitude });
      },
      (err) => {
        debugLog("🚫 Geolocation error:", err);
        // Delay committing the denial, in case success fires right after
        setTimeout(() => {
          if (!successHandled) {
            const errLoc = {
              latitude: null,
              longitude: null,
              address: null,
              error: err.message,
              loading: false,
            };
            setLocation(errLoc);
            setIsValid(false);
            notifyListeners(errLoc);
          } else {
            debugLog(
              "⚠️ Ignored stale permission-denied error; success followed."
            );
          }
        }, 2000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      debugLog("⚙️ AutoFetch enabled — calling getUserLocation()");
      getUserLocation();
    } else {
      debugLog("⚙️ AutoFetch disabled — waiting for manual refetch()");
    }
  }, [autoFetch, getUserLocation]);

  return {
    location,
    isValid,
    refetch: getUserLocation,
    waitForNextUpdate,
  };
}
