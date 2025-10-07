"use client"
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ServiceReport = () => {
  const data = {
    labels: ['Oil Change', 'Tuning', 'Full Service'],
    datasets: [
      {
        data: [47, 28, 18], // Corresponding to the values in the image
        backgroundColor: ['#F9D84D', '#2A7BAE', '#0d1426'], // Yellow, Green, and Light Gray
        borderColor: ['#F9D84D', '#2A7BAE', '#0d1426'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: '80%', // This keeps the hole in the middle, similar to the image
    responsive: true,
    plugins: {
      tooltip: {
        enabled: false, // Hide tooltips
      },
      legend: {
        display: false, // Hide the legend
      },
    },
    rotation: Math.PI, // Rotates the doughnut to match the image's shape and alignment
  };

  return (
    <div style={{ width: '250px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4A4A4A', fontWeight: 'bold' }}>
        <span>Service Report</span>
        <span>Month</span>
      </div>

      <div style={{ marginTop: '20px' }}>
        <Doughnut data={data} options={options} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#F9D84D', marginRight: '5px' , borderRadius:'100%' }}></div>
          <span className='text-xs text-gray-500'>Oil Change</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#3BB5FF', marginRight: '5px',borderRadius:'100%' }}></div>
          <span className='text-xs text-gray-500'>Tuning</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#0d1426', marginRight: '5px', borderRadius:'100%' }}></div>
          <span className='text-xs text-gray-500' >Full Service</span>
        </div>
      </div>

      <button style={{ width: '100%', padding: '10px', backgroundColor: '#2A7BAE', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px' }}>
        View More
      </button>
    </div>
  );
};

export default ServiceReport;
