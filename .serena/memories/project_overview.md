# SelfPM - Project Overview

## Purpose
SelfPM is a personal task management system built for managing complex, multi-step tasks across three key areas of life: personal admin, work, and recurring weekly tasks.

## Key Features
- **Three-Column Organization**: Life Admin, Work Tasks, and Weekly Recurring
- **Complex Task Support**: Multi-step tasks with subtasks and progress tracking  
- **Smart Progress Tracking**: Manual input with visual progress bars
- **Weekly Focus**: Automatically roll over incomplete tasks to next week
- **Smart Task Parser**: Bulk import from text with AI-powered parsing
- **Rich Task Details**: Descriptions, due dates, notes, and status tracking
- **Update Logging**: Track daily progress with timestamped updates
- **Recurring Task Management**: Weekly tasks with completion history
- **Priority & Status Management**: Visual indicators for urgency and progress
- **Real-time Data**: Powered by Supabase for instant updates

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand  
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Deployment**: Netlify
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit
- **File Parsing**: papaparse

## Database Schema
The app uses 4 main tables:
- **tasks**: Main task records with category, status, progress
- **subtasks**: Checkable sub-items for each task  
- **task_updates**: Timestamped progress updates
- **notes**: Quick notes attached to tasks