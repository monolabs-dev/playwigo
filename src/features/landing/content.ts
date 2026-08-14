import { CirclePlay, FolderKanban, ListChecks } from 'lucide-react'

export const features = [
  {
    icon: FolderKanban,
    title: 'Organize Projects',
    description:
      'Manage multiple projects and keep your test cases organized in one place.',
  },
  {
    icon: ListChecks,
    title: 'Feature Management',
    description:
      'Break down your projects into features and track test coverage efficiently.',
  },
  {
    icon: CirclePlay,
    title: 'Automated Testing',
    description:
      'Run Playwright tests with ease and track results in real-time.',
  },
] as const

export const steps = [
  {
    number: '01',
    title: 'Capture',
    description:
      'Pick elements from the page and build test steps without fighting selectors.',
  },
  {
    number: '02',
    title: 'Organize',
    description:
      'Group work into projects and features so coverage stays easy to see.',
  },
  {
    number: '03',
    title: 'Run',
    description:
      'Execute Playwright tests and watch results land as they happen.',
  },
] as const
