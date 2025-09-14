"use client"
import Image from 'next/image'
import React from 'react'

export default function StaffManagement() {
  return (
    <div className="container mx-auto p-8 text-black h-full">
      <div className='flex justify-start gap-10'>
        <div className='w-3/4 bg-white p-6 h-full rounded-md'>
          <div className='flex justify-between items-center'>
            <p className='text-lg font-semibold '> Employees</p>
            <p className='text-lg font-semibold pl-10'> Date Started</p>
            <p className='text-lg font-semibold '> Hours Logged</p>
          </div>
          <div className='flex justify-between items-center mt-6'>
            <div className='flex justify-start gap-2 items-center'>
              <div>
                <Image
                  src="/profile.png"
                  alt="icon"
                  width={50}
                  height={30}
                /> </div>
                <div>
            <p className='font-medium'>Arlen MaCoy</p>
            <p className='text-sm text-gray-600 '> Worker</p>

                </div>
            </div>
            <p className='font-medium mr-2'> Mar 1, 2022</p>
            <p className='font-medium border border-gray-400 rounded-full px-2 py-1 mr-4'> 24 Hours</p>
          </div>
        </div>
        <div className='w-1/4 bg-white p-6 flex flex-col justify-start items-center h-[80vh] pt-10 rounded-md'>
        <div>
  <Image
    src="/profile.png"
    alt="icon"
    width={60}
    height={50}
    quality={40} // Adjusted to a valid value (1-100)
  />
</div>
<p className='text-lg font-medium'>Arlen McCoy</p>
<p className='text-sm text-gray-600'>Arlen McCoy</p>
<p className='text-sm font-medium mt-4'>Phone: +112323232</p>
<p className='text-sm font-medium'>Email: admin@123gmail.com</p>

        </div>
      </div>
    </div>
  )
}
