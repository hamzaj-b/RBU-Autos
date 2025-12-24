// utils/getLocationData.js
export async function getLocationData() {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({
        success: false,
        error: "Geolocation is not supported by this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();

          if (data && data.display_name) {
            resolve({
              success: true,
              latitude,
              longitude,
              address: data.display_name,
            });
          } else {
            resolve({
              success: false,
              latitude,
              longitude,
              error: "Unable to fetch address from coordinates.",
            });
          }
        } catch (err) {
          resolve({
            success: false,
            latitude,
            longitude,
            error: err.message,
          });
        }
      },
      (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      }
    );
  });
}
