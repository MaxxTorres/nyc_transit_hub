import React, { useEffect, useState } from 'react';

const ArrivalTimes = ({ timestamps }) => {
  const [timeRemaining, setTimeRemaining] = useState([]);

  useEffect(() => {
    const currentTime = Date.now();  // Current time in milliseconds

    // Convert each timestamp to the number of minutes remaining
    const calculateRemainingTime = timestamps.map((timestamp) => {
      const timestampInMillis = timestamp * 1000;  // Convert to milliseconds
      const timeDiffInSeconds = (timestampInMillis - currentTime) / 1000;  // Difference in seconds
      const timeDiffInMinutes = Math.max(Math.floor(timeDiffInSeconds / 60), 0);  // Convert to minutes and avoid negative values
      if (!isFinite(timeDiffInMinutes)) {
        return "invalid";  // Display loading or N/A when time is invalid
      }
      return timeDiffInMinutes;
    });

    setTimeRemaining(calculateRemainingTime);
  }, [timestamps]);

  return (
    <div>
      <ul>
        {timeRemaining.map((minutes, index) => (
          <li key={index}>
            {minutes == 0 ? "Arriving now" : minutes == "invalid" ? "..." : (<p>{minutes} min</p>)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArrivalTimes;
