const API_KEY = "8c75b00a0d5741e6f1d93ca78598908e";

export const getWeatherData = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    );
    const data = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, data: null };
  }
};