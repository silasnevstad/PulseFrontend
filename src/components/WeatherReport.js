import React, { useEffect, useState } from 'react';
import Api from './Api';
import './styles/WeatherReport.css';

const WeatherReport = () => {
    const [location, setLocation] = useState(null);
    const [weather, setWeather] = useState(null);
    const { getWeatherData } = Api();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            });
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }, []);

    useEffect(() => {
        if (!location) return;

        getWeatherData(location.lat, location.lon).then((data) => {
            setWeather(data);
        });
    }, [location]);

    if (!weather) return null;

    return (
        <div className="weather-card">
            <div className="left-side">
                <h2 className="temperature" style={weather.current.temp > 70 ? {color: '#FF5E5B'} : {color: '#67B3EE'}}>{weather.current.temp}<span className="">°</span></h2>
                <p><span className="condition">{weather.current.weather[0].main}</span> <span className="weather-faded red hide-hover">Cond.</span></p>
                <p className=""><span className="humidity">{weather.current.humidity}%</span> <span className="weather-faded red hide-hover">Humidity</span></p>
                {/* <p className=""><span className="uvi">{weather.current.uvi}</span> <span className="weather-faded red hide-hover">UV Index</span></p> */}
            </div>
            
            <div className="right-side">
                {weather.hourly.slice(0, 4).map((hour, i) => (
                    <div key={i} className="hour-card">
                        <p className="hour">+{i+1}{i === 0 ? 'hr' : 'hrs'}</p>
                        <p className="hour-temp" style={hour.temp > 70 ? {color: '#FF5E5B'} : {color: '#67B3EE'}}>{Math.round(hour.temp)}°</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherReport;
