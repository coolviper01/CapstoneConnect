export type Student = {
  id: string;
  name: string;
  avatarUrl: string;
};

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
  attendees?: { studentId: string; signature: string }[];
};
