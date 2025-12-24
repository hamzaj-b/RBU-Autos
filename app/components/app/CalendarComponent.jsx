"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays } from "lucide-react";

// Updated events data with bookingName + title
const eventsData = [
  {
    id: "1",
    bookingName: "John Doe",
    title: "Vehicle Maintenance",
    start: "2025-09-12T10:00:00",
    end: "2025-09-12T11:30:00",
  },
  {
    id: "2",
    bookingName: "Jane Smith",
    title: "Oil Change",
    start: "2025-09-15T09:00:00",
    end: "2025-09-15T10:00:00",
  },
  {
    id: "3",
    bookingName: "David Wilson",
    title: "Client Call",
    start: "2025-09-16T14:00:00",
    end: "2025-09-16T15:00:00",
  },
  {
    id: "4",
    bookingName: "Emily Johnson",
    title: "Workshop",
    start: "2025-09-20T09:00:00",
    end: "2025-09-20T17:00:00",
  },
];

export default function CalendarView() {
  return (
    <div className="p-8 bg-white text-black rounded-2xl shadow-md">
      <div className="text-2xl font-bold mb-4 flex items-center gap-2">
        <div className="p-2 border border-darkBlue rounded-full">
          <CalendarDays className="text-blue-bold" />
        </div>
        <p className="text-blue-bold">Calendar</p>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next",
          center: "today title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        titleFormat={{ year: "numeric", month: "long" }}
        buttonText={{
          today: "",
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        events={eventsData}
        height="auto"
        eventContent={(arg) => {
          const bookingName = arg.event.extendedProps.bookingName;
          return (
            <div className="bg-blue-theme text-black rounded-md p-2 text-sm leading-tight">
              <div className="font-semibold">{bookingName}</div>
              <div className="text-xs">{arg.event.title}</div>
            </div>
          );
        }}
      />
    </div>
  );
}
