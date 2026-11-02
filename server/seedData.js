export const initialOpportunities = [
  {
    id: 'opp-1',
    title: 'SVM Unplugged: Acoustic & Vocal Auditions',
    category: 'singing',
    type: 'audition',
    difficulty: 'Beginner-friendly',
    location: 'Main Auditorium, Music Wing',
    schedule: 'Thursday, 4:00 PM – 6:30 PM',
    description: 'Auditions for our upcoming campus acoustic evening. Whether you sing classically, sing in a band, or have never sung on stage before, come share a verse.',
    prerequisites: 'No prior stage experience required. Bring one song of your choice.',
    organizer: 'SVM Music Society',
    spots_total: 25,
    deadline: '2026-11-20'
  },
  {
    id: 'opp-2',
    title: 'Frames of Campus: Architectural & Street Photography Walk',
    category: 'photography',
    type: 'workshop',
    difficulty: 'Beginner-friendly',
    location: 'Student Centre Plaza',
    schedule: 'Saturday morning, 7:30 AM',
    description: 'Learn composition techniques, light metering, and visual narrative as we document the morning geometry of SVM campus.',
    prerequisites: 'Any smartphone with a camera or DSLR. Open to all branches.',
    organizer: 'SVM Shutter Club',
    spots_total: 30,
    deadline: '2026-11-25'
  },
  {
    id: 'opp-3',
    title: 'Short Play Ensemble: Script Reading & Movement',
    category: 'theatre',
    type: 'workshop',
    difficulty: 'Open to all',
    location: 'Black Box Theatre, Block C',
    schedule: 'Wednesday, 5:00 PM',
    description: 'An interactive workshop on script breakdown, vocal projection, and stage blocking for our annual spring drama showcase.',
    prerequisites: 'Comfortable clothing for movement.',
    organizer: 'SVM Theatre Guild',
    spots_total: 20,
    deadline: '2026-11-22'
  },
  {
    id: 'opp-4',
    title: 'Sound Design & Beat Crafting for Campus Filmmakers',
    category: 'music',
    type: 'workshop',
    difficulty: 'Intermediate',
    location: 'Media Production Lab 2',
    schedule: 'Friday, 3:30 PM',
    description: 'Hands-on session covering field recording, foley art, and composing background motifs for short films and student documentaries.',
    prerequisites: 'Basic familiarity with digital audio workstations (DAWs) or music editing software.',
    organizer: 'SVM Audio Engineering Cell',
    spots_total: 15,
    deadline: '2026-11-28'
  },
  {
    id: 'opp-5',
    title: 'Campus Editorial Zine: Graphic Designers & Writers Sprint',
    category: 'graphic_design',
    type: 'collaboration',
    difficulty: 'Beginner-friendly',
    location: 'Design Studio & Innovation Hub',
    schedule: 'Alternate Tuesdays, 5:30 PM',
    description: 'Co-create the biannual student publication "Loopzine". We pair visual artists, typographers, and writers to build multi-page spreads.',
    prerequisites: 'Enthusiasm for layout design, typography, or creative writing.',
    organizer: 'CultureLoop Publications',
    spots_total: 18,
    deadline: '2026-12-01'
  },
  {
    id: 'opp-6',
    title: 'Contemporary & Folk Fusion Dance Intensive',
    category: 'dance',
    type: 'workshop',
    difficulty: 'Beginner-friendly',
    location: 'Dance Studio, Sports Complex 2nd Floor',
    schedule: 'Monday & Thursday, 6:00 PM',
    description: 'Explore foundational body isolations, rhythmic footwork, and fluid transitions blending contemporary flow with Indian folk traditions.',
    prerequisites: 'No dance experience necessary. Everyone moves at their own comfort level.',
    organizer: 'SVM Natya & Groove Collective',
    spots_total: 35,
    deadline: '2026-11-24'
  },
  {
    id: 'opp-7',
    title: 'Event Curators & Stage Logistics Team Callout',
    category: 'event_management',
    type: 'challenge',
    difficulty: 'Open to all',
    location: 'Administrative Concourse Room 104',
    schedule: 'Tuesday, 4:30 PM',
    description: 'Join the planning committee for the SVM Annual Cultural Fest. Learn stage management, artist relations, audio-visual coordination, and live crowd dynamics.',
    prerequisites: 'Strong organizational skills and willingness to coordinate cross-functional teams.',
    organizer: 'SVM Fest Committee',
    spots_total: 20,
    deadline: '2026-11-30'
  },
  {
    id: 'opp-8',
    title: 'Voice Modulation & Emceeing Bootcamp',
    category: 'anchoring',
    type: 'workshop',
    difficulty: 'Beginner-friendly',
    location: 'Seminar Hall 3',
    schedule: 'Saturday, 11:00 AM',
    description: 'Master the art of stage presence, confident delivery, script improvisation, and audience rapport for college symposiums and cultural fests.',
    prerequisites: 'None. Great for students wanting to overcome public speaking hesitation.',
    organizer: 'SVM Debating & Oratory Union',
    spots_total: 25,
    deadline: '2026-12-05'
  }
];

export const initialEvents = [
  {
    id: 'evt-1',
    title: 'SVM Unplugged: Open Mic Night',
    category: 'music',
    date: '12',
    month: 'DEC',
    time: '5:30 PM – 8:30 PM',
    venue: 'Main Amphitheatre',
    description: 'An intimate evening of original songs, poetry readings, acoustic sets, and beatboxing under the stars.',
    type: 'Performance'
  },
  {
    id: 'evt-2',
    title: 'Frames of Campus: Visual Arts Exhibition',
    category: 'photography',
    date: '18',
    month: 'DEC',
    time: '10:00 AM – 6:00 PM',
    venue: 'Student Centre Concourse',
    description: 'Annual photography and graphic design showcase displaying curated prints from SVM student creators.',
    type: 'Exhibition'
  },
  {
    id: 'evt-3',
    title: 'Create Together: Interdisciplinary Jam Session',
    category: 'collaboration',
    date: '08',
    month: 'JAN',
    time: '4:00 PM – 7:00 PM',
    venue: 'Innovation Lab Block D',
    description: 'A dynamic sandbox where musicians, animators, poets, and coders come together to create experimental collaborative pieces.',
    type: 'Workshop'
  },
  {
    id: 'evt-4',
    title: 'SVM One-Act Theatre Fest',
    category: 'theatre',
    date: '22',
    month: 'JAN',
    time: '3:00 PM – 7:30 PM',
    venue: 'Auditorium Hall B',
    description: 'Five student-written, student-directed short dramas exploring campus stories, social themes, and satire.',
    type: 'Performance'
  }
];

export const initialCollaborations = [
  {
    id: 'collab-1',
    profile_id: 'student@svmit.ac.in',
    author_name: 'Aarav Sharma',
    author_discipline: 'videography',
    project_title: 'Documentary Score: "Echoes of the Quad"',
    description: 'Filming a 12-minute documentary on late-night campus architecture and student routines. Need an instrumental composer or acoustic guitarist to craft ambient background motifs.',
    seeking_disciplines: JSON.stringify(['instrumental_music', 'music']),
    status: 'open',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'collab-2',
    profile_id: 'meera.s@svmit.ac.in',
    author_name: 'Meera Sengupta',
    author_discipline: 'poetry',
    project_title: 'Illustrated Poetry Book: "Transit Lines"',
    description: 'I have compiled 14 short poems on moving between hometown and college hostel life. Seeking a graphic designer or digital painter to create minimalist chapter illustrations.',
    seeking_disciplines: JSON.stringify(['painting', 'graphic_design']),
    status: 'open',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'collab-3',
    profile_id: 'rohit.k@svmit.ac.in',
    author_name: 'Rohit Kulkarni',
    author_discipline: 'dance',
    project_title: 'Contemporary Fusion Video Project',
    description: 'Choreographing a dual-performer contemporary piece exploring technological isolation. Seeking a videographer who knows how to shoot dynamic tracking shots on gimbal.',
    seeking_disciplines: JSON.stringify(['videography', 'photography']),
    status: 'open',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];
