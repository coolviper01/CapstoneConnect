import type { Consultation, Student } from './types';

export const students: Student[] = [
  { id: '1', name: 'Alice Johnson', avatarUrl: 'https://picsum.photos/seed/student1/100/100' },
  { id: '2', name: 'Bob Williams', avatarUrl: 'https://picsum.photos/seed/student2/100/100' },
  { id: '3', name: 'Charlie Brown', avatarUrl: 'https://picsum.photos/seed/student3/100/100' },
  { id: '4', name: 'Diana Miller', avatarUrl: 'https://picsum.photos/seed/student4/100/100' },
  { id: '5', name: 'Ethan Davis', avatarUrl: 'https://picsum.photos/seed/student5/100/100' },
];

export const consultations: Consultation[] = [
  {
    id: '1',
    semester: '1st Semester',
    academicYear: '2024-2025',
    capstoneTitle: 'AI-Powered E-commerce Recommendation System',
    blockGroupNumber: 'BSCS-4A, Group 1',
    date: '2024-10-25',
    startTime: '10:00',
    endTime: '11:00',
    venue: 'Innovation Hub',
    projectDetails: 'The project aims to develop a sophisticated recommendation system for an e-commerce platform using machine learning algorithms. It will analyze user behavior, purchase history, and product attributes to provide personalized product suggestions. Key technologies include Python, TensorFlow, and collaborative filtering techniques.',
    status: 'Scheduled',
    students: [students[0], students[1]],
  },
  {
    id: '2',
    semester: '1st Semester',
    academicYear: '2024-2025',
    capstoneTitle: 'Mobile Health Monitoring App',
    blockGroupNumber: 'BSIT-4B, Group 3',
    date: '2024-10-28',
    startTime: '14:00',
    endTime: '15:00',
    venue: 'Room 303',
    projectDetails: 'A cross-platform mobile application for real-time health monitoring. The app will connect to wearable sensors to track vital signs like heart rate and SpO2. Data will be visualized for the user and can be shared with healthcare providers. The tech stack includes React Native and Firebase.',
    status: 'Completed',
    students: [students[2], students[3]],
    notes: 'Discussed the need for robust data encryption for user privacy. The team needs to finalize the UI/UX mockups for the next meeting. Progress is on track.',
    attendees: [
      { studentId: '3', signature: 'Charlie Brown' },
      { studentId: '4', signature: 'Diana Miller' },
    ],
  },
  {
    id: '3',
    semester: '2nd Semester',
    academicYear: '2023-2024',
    capstoneTitle: 'IoT-Based Smart Home Automation',
    blockGroupNumber: 'BSCS-4A, Group 2',
    date: '2024-04-15',
    startTime: '09:00',
    endTime: '10:00',
    venue: 'Online via Google Meet',
    projectDetails: 'This project focuses on creating a cost-effective smart home system using IoT devices. Users can control lights, appliances, and security cameras remotely via a web dashboard. The system will be built on Raspberry Pi and MQTT protocol.',
    status: 'Approved',
    students: [students[4]],
     notes: 'Project is complete and meets all requirements. Approved for final presentation.',
    attendees: [
      { studentId: '5', signature: 'Ethan Davis' },
    ],
  },
];
