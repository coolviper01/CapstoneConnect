
export type Student = {
  id: string;
  name: string;
  avatarUrl?: string; // Made optional as it might not always exist
};

export type Advisor = {
  id: string;
  name: string;
  email: string;
}

export type Attendee = {
  studentId: string; 
  name: string;
  timestamp: string; // Changed from signature to timestamp
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

export type DiscussionPoint = {
  id: string;
  adviserComment: string;
  studentResponse?: string;
  status: 'To Do' | 'On-going' | 'Done';
  category: 'Documentation' | 'Prototype';
}

export type Consultation = {
  id: string;
  semester: string;
  academicYear: string;
  capstoneTitle: string;
  blockGroupNumber: string;
  date?: string; // Optional for pending requests
  startTime?: string; // Optional for pending requests
  endTime?: string; // Optional for pending requests
  venue?: string; // Optional for pending requests
  projectDetails: string;
  status: 'Pending Approval' | 'Scheduled' | 'Completed' | 'Cancelled';
  attendees?: Attendee[];
  discussionPoints?: DiscussionPoint[];
  // Firestore data types
  advisorId?: string;
  studentIds?: string[];
  capstoneProjectId?: string;
  agenda?: string; // New field for student to fill
  attendanceCode?: string; // For QR/manual code attendance
  isAttendanceOpen?: boolean; // To control attendance window
};

    
