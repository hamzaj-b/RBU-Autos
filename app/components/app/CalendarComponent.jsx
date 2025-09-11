"use client"; // if you’re using Next.js App Router

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // for clickable dates
import { CalendarDays } from "lucide-react";

// Dummy JSON data
const eventsData = [
  {
    id: "1",
    title: "Team Meeting",
    start: "2025-09-12T10:00:00",
    end: "2025-09-12T11:30:00",
  },
  {
    id: "2",
    title: "Project Deadline",
    start: "2025-09-15",
    allDay: true,
  },
  {
    id: "3",
    title: "Client Call",
    start: "2025-09-16T14:00:00",
    end: "2025-09-16T15:00:00",
  },
  {
    id: "4",
    title: "Workshop",
    start: "2025-09-20",
    end: "2025-09-23",
    allDay: true,
  },
];

export default function CalendarView() {
  return (
    <div className="p-8 bg-white text-black rounded-2xl shadow-md">
      <div className="text-2xl font-bold mb-4 flex items-center gap-2">
        <div className="p-2 border border-gray-500 rounded-full">
          <CalendarDays className="text-yellow-bold" />
        </div>
        <p className="text-yellow-bold">Calendar</p>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next", // only prev/next buttons
          center: "today title", // today + month/year in center
          right: "dayGridMonth,timeGridWeek,timeGridDay", // view switcher
        }}
        titleFormat={{ year: "numeric", month: "long" }} // "September 2025"
        buttonText={{
          today: "", // keep it labeled
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        events={eventsData}
        eventColor="#3b82f6"
        height="auto"
      />
    </div>
  );
}
