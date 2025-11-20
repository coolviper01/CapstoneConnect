export type Student = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Attendee = {
  studentId: string; 
  signature: string;
}

export type Consultation = {
  id: string;
  semester: string;
  academicYear: string;
  capstoneTitle: string;
  blockGroupNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  projectDetails: string;
  status: 'Scheduled' | 'Completed' | 'Approved' | 'Cancelled';
  students: Student[];
  notes?: string;
  attendees?: Attendee[];
  // Firestore data types
  advisorId?: string;
  studentIds?: string[];
  notesId?: string;
};
