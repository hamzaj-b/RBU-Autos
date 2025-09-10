import React from 'react';
import CustomShape from './CustomShape';

const Chart = () => {
  const dataPoints = [
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 48000 },
    { month: 'Mar', value: 52000 },
    { month: 'Apr', value: 52657 },
    { month: 'May', value: 42000 },
    { month: 'Jun', value: 46000 },
    { month: 'Jul', value: 47000 },
  ];

  return (
    <div className="relative w-full flex gap-10 h-80  p-4">
      {/* Y-axis labels */}
      <div className=" h-full flex flex-col justify-between pr-2">
        <span>60k</span>
        <span>50k</span>
        <span>40k</span>
        <span>30k</span>
      </div>

      {/* X-axis labels and bars */}
      <div className="flex-col justify-between items-start px-10">
        <div className='flex justify-center gap-12 '>
            <CustomShape color="bg-gray-100" width="w-20" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-20" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-20" height="h-60" />
            <CustomShape color="bg-yellow-primary" width="w-20" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-20" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-20" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-20" height="h-60" />

        </div>
      <div className=" flex justify-center gap-16 items-start mt-10">
        {dataPoints.map((point) => (
          <div key={point.month} className="flex flex-col items-center">
            <div
              className={`w-16 h-48 bg-gray-200 rounded-t-lg ${
                point.month === 'Apr' ? 'bg-green-400' : ''
              }`}
              style={{ height: `${(point.value / 60000) * 100}%` }}
            ></div>
            <span className='text-lg'>{point.month}</span>
          </div>
        ))}
      </div>
</div>
      {/* Line and dots */}
      {/* <svg className="absolute top-0 left-10 right-0 h-full">
        <polyline
          fill="none"
          stroke="#6ee7b7" // green-400
          strokeWidth="4"
          points={dataPoints
            .map((point, index) => {
              const x = (index * 16) + 8; // Adjusted for bar width and spacing
              const y = 200 - ((point.value / 60000) * 200); // Scale to SVG height
              return `${x},${y}`;
            })
            .join(' ')}
        />
        {dataPoints.map((point, index) => {
          const x = (index * 16) + 8;
          const y = 200 - ((point.value / 60000) * 200);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r=""
              fill="#6ee7b7" // green-400
            />
          );
        })}
      </svg> */}

      {/* Highlighted April label */}
      {/* {dataPoints.map((point, index) =>
        point.month === 'Apr' ? (
          <div
            key={index}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-green-700 px-2 py-1 rounded shadow"
            style={{ left: `${(index * 16) + 8}px` }}
          >
            £{point.value.toLocaleString()}
            <div className="text-xs">Net sales</div>
          </div>
        ) : null
      )} */}
    </div>
  );
};

export default Chart;