export const CREATIVE_CATEGORIES = [
  { id: 'singing', label: 'Singing & Music', icon: 'music', hint: 'Vocals, instruments and original music' },
  { id: 'dance', label: 'Dance', icon: 'spark', hint: 'Classical, contemporary and freestyle' },
  { id: 'photography', label: 'Photography', icon: 'camera', hint: 'Portraits, places and visual stories' },
  { id: 'art', label: 'Drawing & Painting', icon: 'palette', hint: 'Illustration, painting and fine art' },
  { id: 'writing', label: 'Writing & Poetry', icon: 'pen', hint: 'Poetry, stories and spoken word' },
  { id: 'videography', label: 'Videography', icon: 'video', hint: 'Films, edits and visual narratives' },
  { id: 'anchoring', label: 'Anchoring', icon: 'mic', hint: 'Hosting and public speaking' },
  { id: 'acting', label: 'Acting', icon: 'spark', hint: 'Monologues and stage performance' },
  { id: 'other', label: 'Other Creative Skills', icon: 'spark', hint: 'Everything else you create' }
];

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'singing', label: 'Music' },
  { id: 'dance', label: 'Dance' },
  { id: 'photography', label: 'Photography' },
  { id: 'art', label: 'Art' },
  { id: 'writing', label: 'Writing' },
  { id: 'videography', label: 'Videography' },
  { id: 'other', label: 'Others' }
];

const demoImage = (id, width = 900, height = 720) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;

export const INITIAL_POSTS = [
  {
    id: 'post-1',
    creator: { name: 'Demo Creator One', initials: 'DC', color: '#7652F5', category: 'Photography', bio: 'Finding stories in ordinary places.', badges: [{ id: 'frame-artist', name: 'Frame Artist', image: '/images/badges/frame-artist.png' }, { id: 'creative-explorer', name: 'Creative Explorer', image: '/images/badges/creative-explorer.png' }], badgeCount: 3 },
    timestamp: '2h ago',
    category: 'photography',
    mediaType: 'image',
    media: [demoImage('photo-1516035069371-29a1b244cc32'), demoImage('photo-1500534623283-312aade485b7')],
    caption: 'A quiet morning, framed in warm light. Some places ask you to slow down. ',
    hashtags: ['#VisualDiary', '#CampusStories'],
    likes: 148,
    comments: [{ id: 'comment-1', name: 'Demo Creator Two', initials: 'CT', text: 'The light in this is beautiful!' }],
    saves: 32,
    trending: true
  },
  {
    id: 'post-2',
    creator: { name: 'Demo Creator Two', initials: 'CT', color: '#E17865', category: 'Singing & Music', bio: 'Learning, layering and sharing melodies.', badges: [{ id: 'voice-of-svm', name: 'Voice of SVM', image: '/images/badges/voice-of-svm.png' }, { id: 'rising-star', name: 'Rising Star', image: '/images/badges/rising-star.png' }], badgeCount: 4 },
    timestamp: '5h ago',
    category: 'singing',
    mediaType: 'video',
    media: [demoImage('photo-1511379938547-c1f69419868d', 900, 1100)],
    caption: 'A tiny acoustic take between classes. Headphones recommended.',
    hashtags: ['#Acoustic', '#StudentSessions'],
    likes: 216,
    comments: [{ id: 'comment-2', name: 'Demo Creator Three', initials: 'CT', text: 'Please share the full version!' }, { id: 'comment-3', name: 'Demo Creator Four', initials: 'DF', text: 'This made my day.' }],
    saves: 54,
    trending: true
  },
  {
    id: 'post-3',
    creator: { name: 'Demo Creator Three', initials: 'CT', color: '#2D9CDB', category: 'Drawing & Painting', bio: 'Sketchbooks, color studies and big ideas.', badges: [{ id: 'canvas-creator', name: 'Canvas Creator', image: '/images/badges/canvas-creator.png' }], badgeCount: 2 },
    timestamp: 'Yesterday',
    category: 'art',
    mediaType: 'image',
    media: [demoImage('photo-1549490349-8643362247b5')],
    caption: 'A color study from this week. Still experimenting with softer edges.',
    hashtags: ['#StudioNotes', '#ArtInProgress'],
    likes: 89,
    comments: [],
    saves: 18
  }
];

export const INITIAL_CREATORS = [
  { name: 'Demo Creator One', initials: 'DC', color: '#7652F5', category: 'Photography', bio: 'Finding stories in ordinary places.', badges: [{ id: 'frame-artist', name: 'Frame Artist', image: '/images/badges/frame-artist.png' }], badgeCount: 3 },
  { name: 'Demo Creator Two', initials: 'CT', color: '#E17865', category: 'Music', bio: 'Learning, layering and sharing melodies.', badges: [{ id: 'voice-of-svm', name: 'Voice of SVM', image: '/images/badges/voice-of-svm.png' }], badgeCount: 4 },
  { name: 'Demo Creator Three', initials: 'CT', color: '#2D9CDB', category: 'Art', bio: 'Sketchbooks, color studies and big ideas.', badges: [{ id: 'canvas-creator', name: 'Canvas Creator', image: '/images/badges/canvas-creator.png' }], badgeCount: 2 },
  { name: 'Demo Creator Four', initials: 'DF', color: '#43A47A', category: 'Dance', bio: 'Movement, rhythm and expressive spaces.', badges: [{ id: 'rhythm-keeper', name: 'Rhythm Keeper', image: '/images/badges/rhythm-keeper.png' }], badgeCount: 3 }
];

