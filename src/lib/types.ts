
export type Student = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Advisor = {
  id: string;
  name: string;
  email: string;
}

export type Attendee = {
  studentId: string; 
  signature: string;
}

export type Subject = {
    id: string;
    name: string;
    yearLevel: string;
    blocks: string[];
    teacherId: string;
    academicYear: string;
    semester: string;
}

export type CapstoneProject = {
    id: string;
    title: string;
    details: string;
    studentIds: string[];
    subjectId: string;
    teacherId: string;
    adviserId: string;
    status: 'Pending Teacher Approval' | 'Pending Adviser Approval' | 'Approved' | 'Rejected';
    rejectionReason?: string; // Optional field for feedback
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
  advisor: Advisor;
  notes?: string;
  attendees?: Attendee[];
  // Firestore data types
  advisorId?: string;
  studentIds?: string[];
  notesId?: string;
  capstoneProjectId?: string;
};
