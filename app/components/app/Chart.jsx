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
      <div className=" h-full flex flex-col justify-between pr-2 text-gray-700">
        <span>60k</span>
        <span>50k</span>
        <span>40k</span>
        <span>30k</span>
      </div>

      {/* X-axis labels and bars */}
      <div className="flex-col justify-between items-start">
        <div className='grid grid-cols-7 gap-4'>
            <CustomShape color="bg-gray-100" width="w-18" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-18" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-18" height="h-60" />
            <CustomShape color="bg-yellow-primary" width="w-18" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-18" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-18" height="h-60" />
            <CustomShape color="bg-gray-100" width="w-18" height="h-60" />

        </div>
      <div className=" grid grid-cols-7 gap-4 mt-10">
        {dataPoints.map((point) => (
          <div key={point.month} className="flex flex-col items-center">
            <div
              className={`w-16 h-48 bg-gray-200 rounded-t-lg ${
                point.month === 'Apr' ? 'bg-green-400' : ''
              }`}
              style={{ height: `${(point.value / 60000) * 100}%` }}
            ></div>
            <span className='text-lg text-gray-700'>{point.month}</span>
          </div>
        ))}
      </div>
</div>
    </div>
  );
};

export default Chart;