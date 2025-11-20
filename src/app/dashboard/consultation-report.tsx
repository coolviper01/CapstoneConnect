
'use client';

import React from 'react';
import type { Consultation, Advisor } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ConsultationReportProps {
  consultation: Consultation;
  advisor: Advisor;
}

export const ConsultationReport: React.FC<ConsultationReportProps> = ({ consultation, advisor }) => {

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="printable-area p-8 bg-white text-black font-serif">
        <header className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-4">
             <Image src="/rsu-logo.png" alt="RSU Logo" width={60} height={60} />
             <div>
                <p className="text-sm">Republic of the Philippines</p>
                <h1 className="text-xl font-bold">ROMBLON STATE UNIVERSITY</h1>
             </div>
          </div>
          <Separator className="my-2 bg-black" />
          <h2 className="text-lg font-bold mt-4">CAPSTONE PROJECT CONSULTATION FORM</h2>
        </header>

        <section className="text-sm mb-6">
            <div className="flex justify-end gap-8 mb-4">
                <p>Semester: <span className="font-semibold border-b border-black px-4">{consultation.semester}</span></p>
                <p>A.Y.: <span className="font-semibold border-b border-black px-4">{consultation.academicYear}</span></p>
            </div>
            <div className="grid gap-2">
                <p>Capstone Title: <span className="font-semibold border-b border-black w-full inline-block">{consultation.capstoneTitle}</span></p>
                <p>Block & Group No.: <span className="font-semibold border-b border-black w-full inline-block">{consultation.blockGroupNumber}</span></p>
                <p>Adviser Name and Signature: <span className="font-semibold border-b border-black w-full inline-block">{advisor.name}</span></p>
            </div>
        </section>

        <section className="text-sm mb-6">
            <div className="grid grid-cols-3 gap-4 mb-2">
                <p>Date of Consultation: <span className="font-semibold border-b border-black">{consultation.date ? new Date(consultation.date).toLocaleDateString() : ''}</span></p>
                <p>Start Time: <span className="font-semibold border-b border-black">{consultation.startTime}</span></p>
                <p>End Time: <span className="font-semibold border-b border-black">{consultation.endTime}</span></p>
            </div>
            <p>Venue: <span className="font-semibold border-b border-black w-full inline-block">{consultation.venue}</span></p>
        </section>

        <section className="text-sm mb-8">
          <h3 className="font-bold mb-2">Discussion Points:</h3>
          <div className="border-b border-black pb-1">
             {consultation.discussionPoints?.map((point, index) => (
                <p key={point.id} className="pl-4 pb-2">{index + 1}. {point.adviserComment}</p>
             )) || <p className="pl-4">No discussion points.</p>}
          </div>
           {Array.from({ length: 15 - (consultation.discussionPoints?.length || 0) }).map((_, i) => (
             <div key={i} className="border-b border-black h-6"></div>
           ))}
        </section>

        <section className="text-sm">
          <h3 className="font-bold mb-2">Attendance (Name and Signature)</h3>
           <div className="border-b border-black pb-1">
              {consultation.attendees?.map((attendee, index) => (
                <p key={attendee.studentId} className="pl-4 pb-2">{index + 1}. {attendee.name}</p>
              )) || <p className="pl-4">No attendees.</p>}
           </div>
           {Array.from({ length: 6 - (consultation.attendees?.length || 0) }).map((_, i) => (
             <div key={i} className="border-b border-black h-6"></div>
           ))}
        </section>
      </div>

    </>
  );
};

    