import type { HubRecord, RecordStatus } from './types';

/* ============================================================
   Seed content — illustrative records for the prototype.
   Covers every record type, several cross-category items
   (tagged for 2+ sub-brands), and a spread of lifecycle states
   so the public views AND the moderation/expiry workflow have
   something real to show. Promo images use the bundled motifs.
   Swap this module for a real data source with no UI changes.
   ============================================================ */

const now = new Date();
const day = 86400000;
const iso = (offsetDays: number) => new Date(now.getTime() + offsetDays * day).toISOString();
const atTime = (offsetDays: number, h: number, m = 0) => {
  const d = new Date(now.getTime() + offsetDays * day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** Fill the repetitive fields so each record below stays readable. */
function mk(r: Partial<HubRecord> & Pick<HubRecord,
  'id' | 'type' | 'title' | 'summary' | 'audiences' | 'ageGroups' | 'subjects'>): HubRecord {
  const status: RecordStatus = r.status ?? 'live';
  return {
    usefulForTeachers: false,
    featured: false,
    goLiveDate: iso(-30),
    expiryDate: iso(335),
    submitter: { name: 'Engagement Team', email: 'fse-engagement@manchester.ac.uk', department: 'FSE Engagement' },
    createdAt: iso(-40),
    updatedAt: iso(-30),
    audit: [{ at: iso(-30), by: 'admin@manchester.ac.uk', to: status, note: 'Seed import' }],
    engagement: { views: 0, downloads: 0, thumbsUp: 0, ratingSum: 0, ratingCount: 0 },
    ...r,
    status,
  };
}

export const SEED_RECORDS: HubRecord[] = [
  mk({
    id: 'evt-bang',
    type: 'event',
    title: 'Make It Go BANG! A family science show',
    summary: 'Loud, messy, brilliant. A live show full of explosions, colour changes and the odd surprise — built for younger scientists and their grown-ups.',
    audiences: ['funlab'],
    ageGroups: ['early_years', 'primary'],
    subjects: ['chemistry', 'general_stem'],
    featured: true,
    promoImage: './brand/Volcano_HL.png',
    promoImageAlt: 'Cartoon erupting volcano',
    caption: 'Things will go bang. Safely.',
    event: { start: atTime(9, 14), end: atTime(9, 15), venue: 'University Place, Oxford Rd', bookingUrl: 'https://example.com/book/bang', capacityNote: 'Free, booking needed' },
    engagement: { views: 412, downloads: 0, thumbsUp: 38, ratingSum: 92, ratingCount: 20 },
  }),
  mk({
    id: 'evt-robotics',
    type: 'event',
    title: 'Robotics taster afternoon',
    summary: 'Drop in, drive a robot, and have a go at the code that makes it move. No experience needed — just turn up.',
    audiences: ['futurelab'],
    ageGroups: ['ks3', 'ks4'],
    subjects: ['engineering', 'computing'],
    promoImage: './brand/Robot_HL.png',
    promoImageAlt: 'Friendly cartoon robot',
    event: { start: atTime(20, 13), end: atTime(20, 16, 30), venue: 'Engineering Building A', isOnline: false, capacityNote: 'Drop-in, no booking needed' },
  }),
  mk({
    id: 'act-paperplane',
    type: 'activity',
    title: 'Build a paper plane that actually flies',
    summary: 'A 20-minute build that sneaks in real aerodynamics. Works on a kitchen table or a classroom floor.',
    body: 'You will need paper, a ruler and a steady hand...\n\nThis activity introduces lift, drag and centre of mass through three folds you can test against each other.',
    audiences: ['funlab', 'futurelab'],
    ageGroups: ['primary', 'ks3'],
    subjects: ['physics', 'engineering'],
    usefulForTeachers: true,
    promoImage: './brand/Paper_Plane_HL.png',
    promoImageAlt: 'Paper plane with a dotted flight trail',
    resource: { durationNote: '20 min activity' },
  }),
  mk({
    id: 'dl-volcano',
    type: 'downloadable',
    title: 'Kitchen volcano: an activity to try at home',
    summary: 'The classic fizzing eruption, with a printable sheet that explains what is actually happening in the bubbles.',
    audiences: ['funlab'],
    ageGroups: ['primary'],
    subjects: ['chemistry'],
    promoImage: './brand/Volcano_HL.png',
    promoImageAlt: 'Cartoon erupting volcano',
    resource: { fileUrl: '#', fileLabel: 'PDF, 1.2 MB', durationNote: '30 min' },
    engagement: { views: 980, downloads: 311, thumbsUp: 54, ratingSum: 130, ratingCount: 29 },
  }),
  mk({
    id: 'vid-materials',
    type: 'video',
    title: 'What does a materials scientist actually do?',
    summary: 'Forget test tubes and lab coats for a second. Meet someone whose job is inventing the stuff everything else is made from.',
    audiences: ['futurelab', 'lifelab'],
    ageGroups: ['post16', 'adults'],
    subjects: ['engineering', 'chemistry'],
    promoImage: './brand/Space_Man_HL.png',
    promoImageAlt: 'Cartoon astronaut',
    resource: { externalUrl: 'https://example.com/watch', durationNote: '8 min watch' },
  }),
  mk({
    id: 'rex-batteries',
    type: 'research_explainer',
    title: 'Why we are growing batteries from bacteria',
    summary: 'A Manchester team is using microbes to build greener energy storage. Here is the idea, in plain English.',
    audiences: ['lifelab', 'futurelab'],
    ageGroups: ['post16', 'adults'],
    subjects: ['chemistry', 'environment'],
    featured: true,
    promoImage: './brand/Butterfly_HL.webp',
    promoImageAlt: 'Stylised butterfly illustration',
    research: {
      plainSummary: 'Ordinary batteries rely on metals that are hard to mine and hard to recycle. Our researchers are coaxing bacteria into producing the materials instead — a process that runs at room temperature and could be far kinder to the planet.',
      researchers: 'Dr A. Example & the Bio-Energy Group',
      department: 'Department of Chemistry',
      paperUrl: 'https://doi.org/10.0000/example',
    },
    body: 'The full explainer walks through how the bacteria are grown, what they produce, and where this might lead over the next decade.',
  }),
  mk({
    id: 'wex-summer',
    type: 'work_experience',
    title: 'Summer lab placement: two weeks in a real research group',
    summary: 'Spend a fortnight alongside working researchers, on a real project, with real results at the end of it.',
    audiences: ['futurelab'],
    ageGroups: ['ks4', 'post16'],
    subjects: ['general_stem'],
    promoImage: './brand/Space_Call_Image.png',
    promoImageAlt: 'Hand holding a retro telephone connected to a planet',
    goLiveDate: iso(7),         // scheduled: not live yet
    status: 'approved',
    resource: { externalUrl: 'https://example.com/apply', durationNote: 'Applications open soon' },
  }),
  mk({
    id: 'tut-maths',
    type: 'tutoring',
    title: 'Free online maths mentoring',
    summary: 'Weekly sessions with a student mentor who remembers what it felt like to be stuck on the same thing.',
    audiences: ['futurelab'],
    ageGroups: ['ks3', 'ks4'],
    subjects: ['maths'],
    promoImage: './brand/Game_Controller_HL.png',
    promoImageAlt: 'Games controller illustration',
    resource: { externalUrl: 'https://example.com/mentoring' },
  }),
  mk({
    id: 'bk-everything',
    type: 'book',
    title: 'Recommended read: a short history of nearly everything science-y',
    summary: 'A warm, funny tour of the big questions — a good first step for anyone who thinks science was not for them.',
    audiences: ['lifelab'],
    ageGroups: ['adults'],
    subjects: ['general_stem'],
    promoImage: './brand/Dinosaur_in_Egg_HL.png',
    promoImageAlt: 'Cartoon dinosaur hatching from an egg',
    resource: { externalUrl: 'https://example.com/library' },
  }),
  mk({
    id: 'tg-forces',
    type: 'teaching_guide',
    title: 'Teaching guide: running a hands-on forces carousel',
    summary: 'Five quick stations, the kit list, and timing that fits a single lesson. Built with teachers, for teachers.',
    audiences: ['funlab', 'futurelab'],
    ageGroups: ['primary', 'ks3'],
    subjects: ['physics'],
    usefulForTeachers: true,
    promoImage: './brand/Light_switch_HL.png',
    promoImageAlt: 'Light switch illustration',
    resource: { fileUrl: '#', fileLabel: 'PDF, 3.1 MB' },
  }),
  mk({
    id: 'sch-stemclub',
    type: 'schools_resource',
    title: 'STEM club starter kit for schools',
    summary: 'Everything you need to launch a club that lasts a term. For full schools outreach, we point you to the University team who run it.',
    audiences: ['futurelab'],
    ageGroups: ['ks3'],
    subjects: ['general_stem'],
    usefulForTeachers: true,
    promoImage: './brand/Robot_HL.png',
    promoImageAlt: 'Friendly cartoon robot',
    resource: { externalUrl: 'https://www.manchester.ac.uk/study/schools-colleges/', fileLabel: 'Links to UoM Schools & Colleges' },
  }),
  mk({
    id: 'ext-galaxies',
    type: 'external_link',
    title: 'Join a citizen science project: help classify galaxies',
    summary: 'Real telescope images, real research, and a task you can do from your sofa in five minutes.',
    audiences: ['lifelab', 'futurelab'],
    ageGroups: ['post16', 'adults'],
    subjects: ['space'],
    promoImage: './brand/Space_Call_Image.png',
    promoImageAlt: 'Hand holding a retro telephone connected to a planet',
    resource: { externalUrl: 'https://www.zooniverse.org/' },
    expiryDate: iso(8),         // expiring soon — exercises the reminder logic
  }),
  mk({
    id: 'act-alien',
    type: 'activity',
    title: 'Alien biology: design a creature for another planet',
    summary: 'Pick a world, work out what would survive there, and draw the life that evolved to match. Real biology, dressed up as imagination.',
    audiences: ['funlab', 'futurelab'],
    ageGroups: ['primary', 'ks3'],
    subjects: ['biology', 'space'],
    promoImage: './brand/Alien_HL.png',
    promoImageAlt: 'Friendly cartoon alien in a flying saucer',
    resource: { durationNote: '45 min activity' },
  }),
  mk({
    id: 'vid-news',
    type: 'video',
    title: 'In the news: our spin-out on the breakfast sofa',
    summary: 'One of our research teams took their work to national TV. Watch the clip and read what it was about.',
    audiences: ['lifelab'],
    ageGroups: ['adults'],
    subjects: ['general_stem'],
    promoImage: './brand/Space_Man_HL.png',
    promoImageAlt: 'Cartoon astronaut',
    resource: { externalUrl: 'https://example.com/news-clip', durationNote: '4 min watch' },
    expiryDate: iso(-3),        // already expired — appears in the expiry tab
    status: 'expired',
  }),

  /* --- In the moderation queue (not public): seed Phase 4's admin view --- */
  mk({
    id: 'sub-coding',
    type: 'event',
    title: 'After-school coding club showcase',
    summary: 'Students demo the games and gadgets they have built this term.',
    audiences: ['futurelab'],
    ageGroups: ['ks3', 'ks4'],
    subjects: ['computing'],
    submitter: { name: 'J. Lecturer', email: 'j.lecturer@manchester.ac.uk', department: 'Computer Science' },
    status: 'submitted',
    event: { start: atTime(28, 16), end: atTime(28, 18), venue: 'Kilburn Building' },
    audit: [{ at: iso(-1), by: 'j.lecturer@manchester.ac.uk', to: 'submitted', note: 'Submitted for review' }],
  }),
  mk({
    id: 'sub-podcast',
    type: 'external_link',
    title: 'New podcast episode: the chemistry of cooking',
    summary: 'Our researchers talk through what really happens when you fry an egg.',
    audiences: ['lifelab'],
    ageGroups: ['adults'],
    subjects: ['chemistry'],
    submitter: { name: 'R. Producer', email: 'r.producer@manchester.ac.uk', department: 'FSE Comms' },
    status: 'needs_clarification',
    resource: { externalUrl: 'https://example.com/podcast' },
    audit: [
      { at: iso(-2), by: 'r.producer@manchester.ac.uk', to: 'submitted' },
      { at: iso(-1), by: 'admin@manchester.ac.uk', from: 'submitted', to: 'needs_clarification', note: 'Please add a promo image and confirm the audience.' },
    ],
  }),
];
