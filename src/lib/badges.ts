// PATH: src/lib/badges.ts
// Badge definitions and computation from existing DB data.
// No new DB tables needed — badges are derived from progressRecord,
// quizResult, submission, liveClassAttendance, and enrollment.

export interface Badge {
  id:          string
  name:        string
  description: string
  icon:        string      // emoji
  color:       string      // tailwind bg color
  textColor:   string      // tailwind text color
  earned:      boolean
  earnedAt?:   string      // ISO date if earned
}

interface BadgeInput {
  lessonsCompleted: number
  coursesCompleted: number
  quizzesPassed:    number
  avgQuizScore:     number
  assignmentsDone:  number
  liveAttended:     number
  streakDays:       number
  enrollments:      number
  firstLessonDate?: string
  firstQuizDate?:   string
  firstAssignDate?: string
}

export const BADGE_DEFS = [
  {
    id:          'first_step',
    name:        'First Step',
    description: 'Complete your very first lesson',
    icon:        '👣',
    color:       'bg-[#E9E3FF]',
    textColor:   'text-[#6B52B8]',
    check:       (d: BadgeInput) => d.lessonsCompleted >= 1,
  },
  {
    id:          'quiz_starter',
    name:        'Quiz Starter',
    description: 'Pass your first quiz',
    icon:        '📝',
    color:       'bg-[#DBEAFE]',
    textColor:   'text-[#1D4ED8]',
    check:       (d: BadgeInput) => d.quizzesPassed >= 1,
  },
  {
    id:          'on_a_roll',
    name:        'On a Roll',
    description: 'Complete 10 lessons',
    icon:        '🔥',
    color:       'bg-[#FEF3C7]',
    textColor:   'text-[#D97706]',
    check:       (d: BadgeInput) => d.lessonsCompleted >= 10,
  },
  {
    id:          'assignment_ace',
    name:        'Assignment Ace',
    description: 'Submit your first assignment',
    icon:        '✅',
    color:       'bg-[#DCFCE7]',
    textColor:   'text-[#15803D]',
    check:       (d: BadgeInput) => d.assignmentsDone >= 1,
  },
  {
    id:          'quiz_master',
    name:        'Quiz Master',
    description: 'Pass 5 quizzes with 80%+ average score',
    icon:        '🏆',
    color:       'bg-[#FEF3C7]',
    textColor:   'text-[#D97706]',
    check:       (d: BadgeInput) => d.quizzesPassed >= 5 && d.avgQuizScore >= 80,
  },
  {
    id:          'streak_week',
    name:        '7-Day Streak',
    description: 'Learn for 7 consecutive days',
    icon:        '📅',
    color:       'bg-[#FEE2E2]',
    textColor:   'text-[#B91C1C]',
    check:       (d: BadgeInput) => d.streakDays >= 7,
  },
  {
    id:          'live_attendee',
    name:        'Live Learner',
    description: 'Attend your first live class',
    icon:        '📹',
    color:       'bg-[#E0F2FE]',
    textColor:   'text-[#0369A1]',
    check:       (d: BadgeInput) => d.liveAttended >= 1,
  },
  {
    id:          'course_complete',
    name:        'Course Complete',
    description: 'Finish all lessons in a course',
    icon:        '🎓',
    color:       'bg-[#E9E3FF]',
    textColor:   'text-[#6B52B8]',
    check:       (d: BadgeInput) => d.coursesCompleted >= 1,
  },
  {
    id:          'multi_course',
    name:        'Polymath',
    description: 'Enrol in 3 or more courses',
    icon:        '📚',
    color:       'bg-[#DCFCE7]',
    textColor:   'text-[#15803D]',
    check:       (d: BadgeInput) => d.enrollments >= 3,
  },
  {
    id:          'century',
    name:        'Century',
    description: 'Complete 100 lessons',
    icon:        '💯',
    color:       'bg-[#F4F4F6]',
    textColor:   'text-[#424040]',
    check:       (d: BadgeInput) => d.lessonsCompleted >= 100,
  },
] as const

export function computeBadges(input: BadgeInput): Badge[] {
  return BADGE_DEFS.map(def => ({
    id:          def.id,
    name:        def.name,
    description: def.description,
    icon:        def.icon,
    color:       def.color,
    textColor:   def.textColor,
    earned:      def.check(input),
  }))
}

// Points formula — used for leaderboard
export function computePoints(d: BadgeInput): number {
  return (
    d.lessonsCompleted   * 10  +
    d.quizzesPassed      * 15  +
    Math.round(d.avgQuizScore) +  // bonus for quiz quality
    d.assignmentsDone    * 20  +
    d.liveAttended       * 25  +
    d.coursesCompleted   * 50  +
    d.streakDays         * 5
  )
}