// Official SVM Achievement Badge Registry
// Uses the official 12 SVM badge artwork assets cropped from public/images/badges/svm-achievement-badge-sheet.png

export const SVM_BADGES = [
  {
    id: 'first-step',
    name: 'First Step',
    image: '/images/badges/first-step.png',
    category: 'Beginner',
    filterCategory: 'beginner',
    requirement: 'Complete the first verified creative activity.',
    description: 'Took your very first step into the SVM creative world by submitting your work or joining an activity.',
    xp: 100,
    criteria: 'Submit 1 creative piece or attend your first SVM activity',
    tip: 'Upload any creative recording, visual work, or written piece in AI Showcase.'
  },
  {
    id: 'brave-beginner',
    name: 'Brave Beginner',
    image: '/images/badges/brave-beginner.png',
    category: 'Confidence',
    filterCategory: 'beginner',
    requirement: 'Complete the first verified creative submission or beginner challenge.',
    description: 'Showed creative bravery by sharing work and embracing early mentorship.',
    xp: 150,
    criteria: 'Complete your first verified submission with self-reflection',
    tip: 'Share your work with an exploring or building confidence level.'
  },
  {
    id: 'creative-explorer',
    name: 'Creative Explorer',
    image: '/images/badges/creative-explorer.png',
    category: 'Exploration',
    filterCategory: 'creativity',
    requirement: 'Participate in verified activities across three different creative categories.',
    description: 'Expanded your artistic horizons across 3 distinct creative disciplines.',
    xp: 200,
    criteria: 'Register interest or submit work in at least 3 creative categories',
    tip: 'Add singing, photography, writing, or design into your Creative Passport.'
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    image: '/images/badges/rising-star.png',
    category: 'Growth',
    filterCategory: 'creativity',
    requirement: 'Demonstrate consistent verified improvement and participation over a defined period.',
    description: 'Demonstrated artistic growth, dedication, and quality across evaluated milestones.',
    xp: 250,
    criteria: 'Earn an AI evaluation rating of 7.0+ or submit 2+ evaluated pieces',
    tip: 'Iterate on feedback and submit refined versions of your creative pieces.'
  },
  {
    id: 'voice-of-svm',
    name: 'Voice of SVM',
    image: '/images/badges/voice-of-svm.png',
    category: 'Singing',
    filterCategory: 'creativity',
    requirement: 'Participate in a verified singing activity.',
    description: 'Brought vocal melody, harmony, and presence to SVM.',
    xp: 200,
    criteria: 'Submit a verified vocal performance or singing piece',
    tip: 'Record an acoustic vocal cover or original melody and submit for feedback.'
  },
  {
    id: 'rhythm-keeper',
    name: 'Rhythm Keeper',
    image: '/images/badges/rhythm-keeper.png',
    category: 'Dance',
    filterCategory: 'creativity',
    requirement: 'Participate in a verified dance activity.',
    description: 'Mastered rhythm, body expression, and dynamic motion in dance.',
    xp: 200,
    criteria: 'Submit a verified dance or movement choreography recording',
    tip: 'Submit a solo or group routine in classical, folk, contemporary, or hip-hop.'
  },
  {
    id: 'frame-artist',
    name: 'Frame Artist',
    image: '/images/badges/frame-artist.png',
    category: 'Photography',
    filterCategory: 'creativity',
    requirement: 'Submit verified photography work.',
    description: 'Captured stillness, perspective, and visual narrative through your lens.',
    xp: 200,
    criteria: 'Submit a verified photography or videography piece',
    tip: 'Upload campus architecture, portraiture, street, or documentary stills.'
  },
  {
    id: 'word-weaver',
    name: 'Word Weaver',
    image: '/images/badges/word-weaver.png',
    category: 'Literature',
    filterCategory: 'creativity',
    requirement: 'Complete a verified writing or poetry activity.',
    description: 'Crafted thoughts into poetic lines, stories, or compelling narratives.',
    xp: 200,
    criteria: 'Submit a verified piece of creative writing, poetry, or spoken word',
    tip: 'Share flash fiction, campus poetry, or a script excerpt.'
  },
  {
    id: 'canvas-creator',
    name: 'Canvas Creator',
    image: '/images/badges/canvas-creator.png',
    category: 'Art and Design',
    filterCategory: 'creativity',
    requirement: 'Showcase verified artwork or graphic design.',
    description: 'Brought visual imagination to life through brush, color, or digital canvas.',
    xp: 200,
    criteria: 'Submit a verified painting, sketch, illustration, or graphic design',
    tip: 'Upload acrylics, digital sketches, or campus poster typography.'
  },
  {
    id: 'melody-maker',
    name: 'Melody Maker',
    image: '/images/badges/melody-maker.png',
    category: 'Instrumental Music',
    filterCategory: 'creativity',
    requirement: 'Participate in a verified instrumental music activity.',
    description: 'Created musical harmony and acoustic expression through your instrument.',
    xp: 200,
    criteria: 'Submit a verified instrumental performance or audio track',
    tip: 'Share guitar fingerstyle, keyboard chords, flute, or percussion recording.'
  },
  {
    id: 'team-spirit',
    name: 'Team Spirit',
    image: '/images/badges/team-spirit.png',
    category: 'Collaboration',
    filterCategory: 'collaboration',
    requirement: 'Complete a verified collaborative project.',
    description: 'Connected creators together to build something bigger as an ensemble.',
    xp: 250,
    criteria: 'Post a collaboration call or send a collaboration request',
    tip: 'Connect with a musician, filmmaker, or poet in the Collaborate hub.'
  },
  {
    id: 'culture-contributor',
    name: 'Culture Contributor',
    image: '/images/badges/culture-contributor.png',
    category: 'Community',
    filterCategory: 'community',
    requirement: 'Make a verified contribution to an SVM cultural activity or event.',
    description: 'Active participant and supporter of the campus cultural ecosystem.',
    xp: 150,
    criteria: 'RSVP to an SVM cultural event or register for a creative opportunity',
    tip: 'RSVP to an upcoming campus fest or register for an audition.'
  }
];

export const BADGE_FILTER_TABS = [
  { id: 'all', label: 'All Badges' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'creativity', label: 'Creativity' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'community', label: 'Community' }
];

