import { activityById, levels } from "../curriculum/foundations";

export interface LessonSection {
  title: string;
  minutes: number;
  /** What to do and say, in order. */
  script: string[];
  /** Asides only a teacher would know. */
  teacherTips?: string[];
}

export interface LessonPlan {
  levelId: string;
  chapter: number;
  title: string;
  tagline: string;
  /** Rough in-person lesson length. */
  durationMinutes: number;
  goal: string;
  materials: string[];
  sections: LessonSection[];
  commonMistakes: Array<{ mistake: string; fix: string }>;
  /** Activity ids in the app the student practices between lessons. */
  activityIds: string[];
  /** What to see before moving the student on. */
  assessment: string[];
}

export const lessonPlans: LessonPlan[] = [
  {
    levelId: "level-1",
    chapter: 1,
    title: "Guitar Explorer",
    tagline: "First contact: hold it, name it, make it sound.",
    durationMinutes: 50,
    goal: "The student holds the guitar comfortably, names the main parts, numbers the strings and fingers, and makes their first controlled sounds with a pick.",
    materials: [
      "A guitar that fits the student (they should reach the first fret without stretching)",
      "A medium pick",
      "A tuner — tune before the lesson starts",
      "Footstool or strap if the guitar slides",
    ],
    sections: [
      {
        title: "Welcome and guitar anatomy",
        minutes: 10,
        script: [
          "Hand them the guitar and let them explore it for a minute — curiosity first, vocabulary second.",
          "Point and name together: body, neck, headstock, tuning pegs, frets, fretboard, nut, bridge, sound hole.",
          "Make it a game: you point, they name. Then swap.",
        ],
        teacherTips: [
          "Students remember parts they have touched. Have them tap each part as they name it.",
        ],
      },
      {
        title: "String numbers",
        minutes: 8,
        script: [
          "String 1 is the thinnest, highest string (closest to the floor); string 6 is the thickest, lowest.",
          "Pluck each string and count together: 6-5-4-3-2-1, then 1-2-3-4-5-6.",
          "Call out random numbers — they pluck that string without looking at a diagram.",
        ],
        teacherTips: [
          "The numbering feels backwards to everyone at first. Normalize it: “every guitarist alive found this weird on day one.”",
        ],
      },
      {
        title: "Finger numbers",
        minutes: 5,
        script: [
          "Fretting hand: index is 1, middle 2, ring 3, pinky 4. The thumb is not numbered — it stays behind the neck.",
          "Have them wiggle each finger as you call its number.",
        ],
      },
      {
        title: "Holding and posture",
        minutes: 10,
        script: [
          "Sit upright, both feet supported. Rest the guitar against the body so it stays put without being gripped.",
          "The fretting hand supports nothing — its only job is to press strings. Shoulders stay soft and low.",
          "Check in explicitly: “anything uncomfortable or painful?” Adjust before continuing.",
        ],
        teacherTips: [
          "Watch the fretting thumb creeping over the top of the neck — gently reset it behind the neck.",
          "Pain is information, not weakness. Soreness in fingertips is normal; wrist or shoulder pain is a posture problem to fix now.",
        ],
      },
      {
        title: "First sounds with the pick",
        minutes: 12,
        script: [
          "Hold the pick lightly between thumb and index — firm enough not to drop, loose enough to flex.",
          "Pick the open 1st string twice, slowly. Then the 2nd. Listen for the contrast.",
          "Play a tiny pattern: 1st string, 1st string, 2nd string. Go slowly and enjoy the sound.",
        ],
        teacherTips: [
          "A death-grip on the pick is the most common day-one habit. If the knuckles are white, it is too tight.",
        ],
      },
      {
        title: "Wrap-up and assignment",
        minutes: 5,
        script: [
          "Recap in their words: ask them to name three parts and number the strings once more.",
          "Assign the Chapter 1 app activities for the week — two minutes a day beats twenty minutes once.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Gripping the neck like a baseball bat",
        fix: "Thumb behind the neck, fingers curved. The hand holds nothing up — the body supports the guitar.",
      },
      {
        mistake: "Slouching over the guitar to see the strings",
        fix: "Sit tall and tilt the guitar neck slightly upward instead of folding the spine.",
      },
      {
        mistake: "Pick held so tight the wrist locks",
        fix: "Shake the hand out, re-grip lightly, and strum from the wrist, not the elbow.",
      },
    ],
    activityIds: ["parts", "strings", "fingers", "holding", "first-notes"],
    assessment: [
      "Names the body, neck, headstock, frets, bridge and sound hole without prompting.",
      "Plucks any called-out string number, 1 through 6, both directions.",
      "Shows fingers 1–4 on demand and keeps the thumb behind the neck.",
      "Sits comfortably and makes controlled open-string sounds for two minutes.",
    ],
  },
  {
    levelId: "level-2",
    chapter: 2,
    title: "First Notes",
    tagline: "Small movements, clear confident notes.",
    durationMinutes: 45,
    goal: "The student plays three clean notes in a row with deliberate fingertip placement just behind the fret.",
    materials: [
      "Tuned guitar and pick",
      "A mirror or phone camera so they can see their hand shape (optional but powerful)",
    ],
    sections: [
      {
        title: "Review and warm-up",
        minutes: 5,
        script: [
          "Quick check: string numbers, finger numbers, comfortable hold.",
          "Two minutes of open-string picking to wake the hands up.",
        ],
      },
      {
        title: "Fretting mechanics",
        minutes: 10,
        script: [
          "Demonstrate: fingertip presses just behind the fret wire — not on top of it, not in the middle of the fret.",
          "Press with the very tip of finger 1 on the 1st string, fret 1. Pluck. It should ring clear.",
          "Show the two failure sounds on purpose: too far back (buzz) and flat finger (muted neighbor). Then the clean version.",
        ],
        teacherTips: [
          "Students press far too hard. Ask for the lightest press that still rings — then a touch more. Fingertip soreness drops dramatically.",
        ],
      },
      {
        title: "The 0–1–2–3 pattern",
        minutes: 15,
        script: [
          "On the 1st string: open, finger 1 at fret 1, finger 2 at fret 2, finger 3 at fret 3. One pluck per note, slowly.",
          "Repeat on the 2nd string.",
          "Go back and forth between the strings. Slow is the whole game — speed is a side effect of accuracy.",
        ],
        teacherTips: [
          "Keep fingers hovering close to the strings between notes. Flying fingers are the habit to prevent now.",
          "If the pinky refuses to cooperate, let fingers 1–3 carry the pattern for a week.",
        ],
      },
      {
        title: "A tiny musical phrase",
        minutes: 10,
        script: [
          "String the notes into a little melody: 0-1-2-3 on string 2, then 3-2-1-0 back down.",
          "Play it together, then let them play it solo twice.",
          "Name what just happened: they played a melody. Let that land.",
        ],
      },
      {
        title: "Wrap-up and assignment",
        minutes: 5,
        script: [
          "Assign the First Notes app activity. The win for the week: three clean notes in a row, twice in a row.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Pressing directly on top of the fret wire",
        fix: "Slide the fingertip back until it sits just behind the fret — the note cleans up instantly.",
      },
      {
        mistake: "Flat fingers muting neighboring strings",
        fix: "Curve from the knuckle so the fingertip comes down vertically, like a little hammer.",
      },
      {
        mistake: "Rushing the pattern and blurring the notes",
        fix: "Halve the tempo. One beautiful slow note beats four sloppy fast ones.",
      },
    ],
    activityIds: ["first-notes"],
    assessment: [
      "Plays three clean notes in a row, twice, without buzzing or muting.",
      "Places fingertips just behind the fret without being reminded.",
      "Keeps a steady, unhurried pace through the 0–1–2–3 pattern on both strings.",
    ],
  },
  {
    levelId: "level-3",
    chapter: 3,
    title: "First Chords",
    tagline: "A few fingers, a whole new sound.",
    durationMinutes: 60,
    goal: "The student builds Em and Am from memory, three times each, with every intended string ringing.",
    materials: [
      "Tuned guitar and pick",
      "Chord diagrams for Em and Am (the app's chord library works on a phone or tablet)",
    ],
    sections: [
      {
        title: "Review",
        minutes: 5,
        script: [
          "Play the 0–1–2–3 pattern together once — it is now their warm-up, not their lesson.",
        ],
      },
      {
        title: "E minor",
        minutes: 15,
        script: [
          "Show the Em diagram: fingers 2 and 3 on strings 5 and 4 at fret 2. Two fingers, six strings.",
          "Build it one finger at a time. Then pick each string slowly, listening for dead ones.",
          "Strum all six strings. Lift the hand completely, shake it out, and rebuild — three clean builds.",
        ],
        teacherTips: [
          "Em is a confidence chord: it sounds full with only two fingers. Let them enjoy how big it sounds.",
        ],
      },
      {
        title: "A minor",
        minutes: 20,
        script: [
          "Show the Am diagram: finger 1 on string 2 fret 1; fingers 2 and 3 on strings 4 and 3, fret 2.",
          "Critical detail: strum strings 5 through 1 — the thickest string stays quiet.",
          "Build it finger by finger: 1, then 2, then 3. Pick strings 5–1 one at a time and fix any muted string before strumming.",
          "Rebuild from scratch three times. Speed comes later; clean builds now.",
        ],
        teacherTips: [
          "The usual culprit for a dead string in Am is finger 1 leaning onto string 1, or finger 3 touching string 2. Diagnose by picking one string at a time.",
          "If the stretch hurts, the thumb has drifted. Reset it behind the neck, roughly behind finger 2.",
        ],
      },
      {
        title: "Tone check game",
        minutes: 10,
        script: [
          "They build Am, you pick the strings one by one and they call out “ringing” or “dead”. Then swap roles.",
          "For every dead string, they adjust one thing — fingertip closer to the fret, finger more curved — and re-test.",
        ],
      },
      {
        title: "Memory rebuild",
        minutes: 5,
        script: [
          "Hide the diagrams. They rebuild Em, then Am, purely from memory. Peek once if needed — then hide again.",
        ],
      },
      {
        title: "Wrap-up and assignment",
        minutes: 5,
        script: [
          "Assign the Chapter 3 app activities, including the Am memory-rebuild exercise. Three clean builds of each chord is the week's goal.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "A neighboring finger mutes a string that should ring",
        fix: "Pick strings one at a time to find the culprit, then curve that finger so only its tip touches.",
      },
      {
        mistake: "Strumming all six strings on Am",
        fix: "Aim the pick at string 5. Rest the pick on string 5 before strumming until the aim is automatic.",
      },
      {
        mistake: "Lifting fingers centimeters off the fretboard between tries",
        fix: "Rebuild with fingers hovering just above the strings — small movements, fast progress.",
      },
    ],
    activityIds: ["em-shape", "am-shape", "am-reconstruction", "am-placement", "am-tone"],
    assessment: [
      "Builds Em from memory three times with all six strings ringing.",
      "Builds Am from memory three times, strumming only strings 5–1.",
      "Identifies which string is muted and fixes it without help.",
    ],
  },
  {
    levelId: "level-4",
    chapter: 4,
    title: "Rhythm & Strumming",
    tagline: "Find the steady beat inside every song.",
    durationMinutes: 45,
    goal: "The student keeps a relaxed, steady strumming pattern for about 30 seconds — downstrokes first, then down-up.",
    materials: ["Tuned guitar and pick", "Metronome or the app's rhythm tool at 60 BPM"],
    sections: [
      {
        title: "Pulse before guitar",
        minutes: 10,
        script: [
          "No guitar yet: clap a steady 1-2-3-4 together at 60 BPM. Then tap it on knees.",
          "Have them count out loud while you clap — internalizing the pulse matters more than the hands.",
          "Speed it up slightly, slow it down. The pulse stays even; only the tempo changes.",
        ],
        teacherTips: [
          "Students who rush almost always rush the clapping too. Fix the pulse away from the guitar first.",
        ],
      },
      {
        title: "Downstrokes on Em",
        minutes: 10,
        script: [
          "Build Em. Strum down on each beat: D-D-D-D, counting 1-2-3-4 with the metronome.",
          "The motion comes from a loose wrist — the elbow barely moves.",
          "Aim for 30 steady seconds. If the beat is lost, breathe and rejoin on the next 1.",
        ],
      },
      {
        title: "Adding upstrokes",
        minutes: 12,
        script: [
          "Keep the hand moving down-up-down-up like a pendulum, even on beats you don't strike.",
          "Pattern: D-U-D-U, counting “1 & 2 &”. Start with just beats 1 and 2, then add 3 and 4.",
          "Try it on Am too — the chord can wobble a little; the rhythm must not.",
        ],
        teacherTips: [
          "The pendulum image prevents the classic stop-start strum. The hand never freezes mid-pattern.",
        ],
      },
      {
        title: "Musicality",
        minutes: 8,
        script: [
          "Play the D-U-D-U pattern with a loud beat 1 and softer beats 2-3-4 — instant music.",
          "Trade fours: you play four beats, they answer with four beats.",
        ],
      },
      {
        title: "Wrap-up and assignment",
        minutes: 5,
        script: [
          "Assign the rhythm activity. The week's goal: 30 seconds of unbroken D-U-D-U at 60 BPM.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Speeding up whenever it starts feeling good",
        fix: "Keep the metronome on. Feeling good is not the same as staying steady — the click is the referee.",
      },
      {
        mistake: "Strumming from the elbow with a locked wrist",
        fix: "Pretend to shake water off the hand — that loose wrist is the strumming motion.",
      },
      {
        mistake: "Stopping the strumming hand when a chord buzzes",
        fix: "The right hand is a train: it does not stop for a wrong note. Fix the chord on the next pass.",
      },
    ],
    activityIds: ["rhythm"],
    assessment: [
      "Holds D-D-D-D at 60 BPM for 30 seconds without speeding up or stopping.",
      "Plays D-U-D-U with a continuous pendulum motion of the hand.",
      "Rejoins the beat after a mistake instead of stopping.",
    ],
  },
  {
    levelId: "level-5",
    chapter: 5,
    title: "Chord Changes",
    tagline: "Bring the shapes together.",
    durationMinutes: 45,
    goal: "The student moves between Em and Am with a steady rhythm — clean movement matters more than speed.",
    materials: ["Tuned guitar and pick", "Metronome at a slow tempo (50–60 BPM)"],
    sections: [
      {
        title: "Shapes review",
        minutes: 8,
        script: [
          "Build Em, strum once. Build Am, strum once. Two clean builds each — no rushing into changes yet.",
        ],
      },
      {
        title: "Anchor and pivot fingers",
        minutes: 10,
        script: [
          "Compare the shapes: finger 2 stays on fret 2, just moving from string 5 (Em) to string 4 (Am). It barely lifts — it pivots.",
          "Practice the move in slow motion: Em → hover → Am. Watch finger 2 stay close to the fretboard.",
          "Name it: the anchor finger. Every future chord change will have one — finding it is the skill.",
        ],
        teacherTips: [
          "This is the most transferable lesson in the chapter. Students who hunt for anchor fingers learn every later change twice as fast.",
        ],
      },
      {
        title: "Slow changes with rhythm",
        minutes: 12,
        script: [
          "Two beats of Em, two beats of Am, at 50 BPM. The change happens on time, even if the shape is not perfect yet.",
          "If a shape is messy, keep the rhythm going and fix it on the next round.",
          "Only when it is clean at 50, try 60.",
        ],
      },
      {
        title: "One-minute changes drill",
        minutes: 8,
        script: [
          "How many clean Em↔Am changes in one minute? Count only the ones where both chords ring.",
          "Write the number down. Next week they beat it — measurable progress is motivating.",
        ],
      },
      {
        title: "Wrap-up and assignment",
        minutes: 7,
        script: [
          "Assign the transitions activity. The week's goal: beat today's one-minute count with clean changes.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Lifting all fingers high off the neck to change",
        fix: "Slow-motion the change and watch: fingers travel millimeters, not centimeters. The anchor finger barely leaves the strings.",
      },
      {
        mistake: "Stopping the strumming hand to place the next chord",
        fix: "The right hand keeps time no matter what. A late chord on the beat beats a perfect chord off it.",
      },
      {
        mistake: "Practicing only the change they can already do",
        fix: "Isolate the direction that fails — usually Am→Em — and drill just that for two minutes.",
      },
    ],
    activityIds: ["transitions"],
    assessment: [
      "Changes Em↔Am at 60 BPM with the rhythm unbroken.",
      "Identifies the anchor finger (finger 2) and keeps it close to the fretboard during changes.",
      "Improves their one-minute clean-change count week over week.",
    ],
  },
  {
    levelId: "level-6",
    chapter: 6,
    title: "My First Song",
    tagline: "Turn practice into music.",
    durationMinutes: 60,
    goal: "The student plays a teacher-selected progression with recognizable chords and continuous rhythm — their first real song.",
    materials: [
      "Tuned guitar and pick",
      "A simple two- or three-chord progression using chords they know (Em–Am is the natural start; add G or C when ready)",
      "Lyric/chord sheet if the song has words they want to sing later",
    ],
    sections: [
      {
        title: "Choose the progression",
        minutes: 5,
        script: [
          "Pick a progression they already love or one that fits Em–Am (many beginner songs live on two chords).",
          "Set the bar out loud: recognizable chords, continuous rhythm. Perfection is not the goal — music is.",
        ],
        teacherTips: [
          "Let them choose from two or three options you pre-vetted. Ownership of the song choice doubles practice time at home.",
        ],
      },
      {
        title: "Section by section",
        minutes: 20,
        script: [
          "Break the song into 2–4 bar sections. Learn section one only: chords, then chords with rhythm, slowly.",
          "Do not move on until section one is recognizable. Then section two.",
          "The weakest section gets the most repetitions — that is where the song is actually learned.",
        ],
      },
      {
        title: "Connect the sections",
        minutes: 15,
        script: [
          "Play section one into section two. The transition between sections is its own thing to practice.",
          "Add sections one at a time until the whole progression flows.",
          "Drop the tempo 10 BPM below comfort for the first full run-through — then bring it back up.",
        ],
        teacherTips: [
          "Consider building a guided practice routine in the app for this song: one block per section. It gives them a structured way to drill it all week.",
        ],
      },
      {
        title: "Performance run-through",
        minutes: 12,
        script: [
          "They play the whole thing top to bottom while you listen like an audience — no stopping them to fix things.",
          "Applaud genuinely, then give two specific praises and one focused fix.",
          "Record it on their phone if they are willing. First-song recordings become treasured.",
        ],
      },
      {
        title: "Celebrate and set the next goal",
        minutes: 8,
        script: [
          "Name what changed: weeks ago these were isolated exercises; today it was music.",
          "Set the next goal together — a second song, or the same song smoother — and write it in their app goal field.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Starting at full speed and falling apart",
        fix: "Find the tempo where it works, then raise it 5 BPM at a time. The metronome is not optional this week.",
      },
      {
        mistake: "Restarting from the top after every mistake",
        fix: "Mistakes get a two-bar loop around the trouble spot, not a full restart. Restarts rehearse the easy parts.",
      },
      {
        mistake: "Only practicing the section they like",
        fix: "Practice time follows weakness: the section they avoid is the section they drill.",
      },
    ],
    activityIds: ["transitions", "rhythm"],
    assessment: [
      "Plays the full progression with recognizable chords and unbroken rhythm.",
      "Recovers from a mistake without stopping or restarting.",
      "Can name which section needs the most work and why.",
    ],
  },
  {
    levelId: "level-7",
    chapter: 7,
    title: "Guitar Player",
    tagline: "Read the chart, build the repertoire.",
    durationMinutes: 60,
    goal: "The student reads a chord chart independently and prepares three songs or substantial progressions.",
    materials: [
      "Printed or on-screen chord charts for 2–3 new songs",
      "The app's chord library for new shapes (open the Notes dot-labels to show chord tones)",
    ],
    sections: [
      {
        title: "Reading chord charts",
        minutes: 15,
        script: [
          "Show a chart: chord names over lyrics or bar lines, section labels (verse, chorus), repeat signs.",
          "Read it together first — say the chord names in rhythm before touching the guitar.",
          "They play through once slowly, following the chart with their eyes, not memory.",
        ],
        teacherTips: [
          "Chart reading is a separate skill from playing. Let the eyes lead: if they stare at their hand, the chart cannot help them.",
        ],
      },
      {
        title: "New chord shapes",
        minutes: 15,
        script: [
          "Introduce the next chords their songs need — typically G, C, D in some order.",
          "Use the app's chord library: start with the Open voicing, check the barre-shape tab only when they ask for it.",
          "One new chord per lesson is plenty. Two new chords plus a song is a recipe for mush.",
        ],
        teacherTips: [
          "Teach the anchor-finger relationship between the new chord and one they know (e.g. G→Em shares finger 2 territory).",
        ],
      },
      {
        title: "Repertoire building",
        minutes: 20,
        script: [
          "Each song gets the chapter-6 treatment: sections, weakest first, connect, perform.",
          "Keep a repertoire list — three songs they can play on request. Review old songs briefly each lesson so they stay alive.",
          "End with a mini-set: all three songs back to back, like a tiny gig.",
        ],
      },
      {
        title: "Wrap-up",
        minutes: 10,
        script: [
          "Update their repertoire list together. Pick the next song — one they choose, one you choose.",
          "If they are ready, share a guided practice routine targeting their weakest song section.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Ignoring section labels and learning the song as one blur",
        fix: "Map the chart first: verse chords, chorus chords. Practice the chorus — it repeats, so it pays double.",
      },
      {
        mistake: "Learning every song from the beginning",
        fix: "Start new songs at the hardest section. Beginnings learn themselves.",
      },
      {
        mistake: "Letting old songs rot while learning new ones",
        fix: "Five minutes of repertoire maintenance per practice session keeps all three songs gig-ready.",
      },
    ],
    activityIds: [],
    assessment: [
      "Follows a chord chart through verse and chorus without stopping to ask what comes next.",
      "Holds three songs or substantial progressions at performance level.",
      "Learns a new chord shape from the library with minimal help.",
    ],
  },
  {
    levelId: "level-8",
    chapter: 8,
    title: "Independent Musician",
    tagline: "Learn how to learn your next song.",
    durationMinutes: 60,
    goal: "The student prepares a familiar-style progression with limited guidance — and can repeat the process alone.",
    materials: [
      "A new chord chart in a familiar style, not previously studied",
      "Their repertoire list and practice routine setup",
    ],
    sections: [
      {
        title: "The independent workflow",
        minutes: 15,
        script: [
          "Teach the workflow explicitly — this is the real curriculum of chapter 8:",
          "1. Listen to the song and map its sections. 2. Identify the chords (chart or ear). 3. Learn new shapes slowly. 4. Drill the weakest section. 5. Connect and perform.",
          "Write it down for them. It should fit on an index card they keep in their case.",
        ],
      },
      {
        title: "Guided independence",
        minutes: 25,
        script: [
          "Hand them the new chart and step back. You are a consultant now, not a driver.",
          "They map sections, identify chords, and start the weakest section. You answer questions; you do not lead.",
          "Resist fixing things quickly — ten seconds of their struggle teaches more than your instant answer.",
        ],
        teacherTips: [
          "The hardest part of this lesson is yours: staying quiet. Set a rule for yourself — they must ask before you offer.",
        ],
      },
      {
        title: "Troubleshoot session",
        minutes: 12,
        script: [
          "They present their progress and name what is not working yet.",
          "Coach the troubleshooting, not the song: “what have you tried? what is the smallest loop that contains the problem?”",
          "Agree on a practice plan they design — you only veto what is unrealistic.",
        ],
      },
      {
        title: "Graduation conversation",
        minutes: 8,
        script: [
          "Review the journey: from naming parts to learning songs alone. Say what you have noticed about their musicianship specifically.",
          "Explain what graduation unlocks in the app: the practice studio is theirs now, and they can build their own routines.",
          "Set the ongoing rhythm: regular playing, occasional check-ins, and songs they love. Musicianship is maintenance, not a finish line.",
        ],
      },
    ],
    commonMistakes: [
      {
        mistake: "Skipping the slow-tempo step because the song feels familiar",
        fix: "Familiar ears, unfamiliar hands. The first run-through is always 20% under tempo.",
      },
      {
        mistake: "No sectional practice — always top-to-bottom",
        fix: "Ask: “which four bars are the worst?” That is the practice session.",
      },
      {
        mistake: "Treating graduation as the end of learning",
        fix: "Reframe: the course taught them to teach themselves. The next hundred songs are the actual course.",
      },
    ],
    activityIds: [],
    assessment: [
      "Maps a new chart's sections and identifies its chords with only questions, not answers, from you.",
      "Designs their own sectional practice plan and follows it.",
      "Demonstrates the full independent workflow on a second, unseen progression.",
    ],
  },
];

/** Plans in chapter order, each attached to its curriculum level. */
export function getLessonPlan(levelId: string): LessonPlan | undefined {
  return lessonPlans.find((p) => p.levelId === levelId);
}

/** Throws in development/test if the plans drift from the curriculum. */
export function validateLessonPlans(): string[] {
  const errors: string[] = [];
  if (lessonPlans.length !== levels.length) {
    errors.push(`expected ${levels.length} plans, found ${lessonPlans.length}`);
  }
  lessonPlans.forEach((plan, i) => {
    const level = levels[i];
    if (!level) return;
    if (plan.levelId !== level.id)
      errors.push(`plan ${i + 1} targets ${plan.levelId}, expected ${level.id}`);
    if (plan.chapter !== i + 1) errors.push(`plan ${plan.levelId} has chapter ${plan.chapter}`);
    for (const id of plan.activityIds) {
      if (!activityById(id)) errors.push(`plan ${plan.levelId} references unknown activity ${id}`);
    }
    if (plan.sections.length === 0) errors.push(`plan ${plan.levelId} has no sections`);
    for (const s of plan.sections) {
      if (s.minutes <= 0) errors.push(`plan ${plan.levelId} section "${s.title}" has no time`);
      if (s.script.length === 0) errors.push(`plan ${plan.levelId} section "${s.title}" has no script`);
    }
  });
  return errors;
}
