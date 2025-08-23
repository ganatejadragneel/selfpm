# SelfPM - Personal Task Management System

A powerful yet simple personal task management system built for managing complex, multi-step tasks across three key areas of life: personal admin, work, and recurring weekly tasks.

## 🎯 Key Features

### Core Functionality
- **Three-Column Organization**: Life Admin, Work Tasks, and Weekly Recurring
- **Complex Task Support**: Multi-step tasks with subtasks and progress tracking  
- **Smart Progress Tracking**: Manual input with visual progress bars
- **Weekly Focus**: Automatically roll over incomplete tasks to next week
- **Smart Task Parser**: Bulk import from text with AI-powered parsing

### Advanced Features
- **Rich Task Details**: Descriptions, due dates, notes, and status tracking
- **Update Logging**: Track daily progress with timestamped updates
- **Recurring Task Management**: Weekly tasks with completion history
- **Priority & Status Management**: Visual indicators for urgency and progress
- **Real-time Data**: Powered by Supabase for instant updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Free Supabase account ([supabase.com](https://supabase.com))

### 1. Clone and Install
```bash
git clone <your-repo>
cd selfpm
npm install
```

### 2. Set Up Supabase

#### Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Click "New Project"  
3. Choose organization, name your project (e.g. "selfpm")
4. Set a database password (save it!)
5. Choose region closest to you
6. Wait for project to be created

#### Get Your Credentials
1. In your Supabase dashboard, go to Settings → API
2. Copy your project URL and anon/public key
3. Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Create Database Tables
1. In Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run" to create all tables and policies

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 📱 Usage Guide

### Creating Tasks

#### Quick Add (Single Task)
1. Click "Quick Add" button
2. Select category (Life Admin, Work, Weekly) 
3. Enter task details:
   - Title (required)
   - Description (optional)
   - Due date (optional)
   - Progress goal (optional number)
4. Click "Add Task"

#### Bulk Add (Multiple Tasks)
1. Click "Bulk Add" button  
2. Switch to "Bulk Add" tab
3. Paste your task list (supports various formats):

```
1. Review blood test results and identify next steps
2. Complete 50 user stories for work project  
3. Read 80 pages of Team of Teams book
4. Order birthday gift for friend next week
```

The parser automatically detects:
- Task numbers and creates separate tasks
- Progress goals (50 stories, 80 pages)
- Due dates (next week, Friday, etc.)
- Categories based on content keywords
- Subtasks (indented or marked with bullets)

### Managing Tasks

#### Task Status
Click the status icon on any task card to cycle through:
- ⭕ **To Do** → 🔵 **In Progress** → ✅ **Done** → 🔴 **Blocked**

#### Detailed Task View
Click on any task to open the detailed modal:
- Edit title and description
- Manage subtasks with checkboxes
- Update progress manually
- Add timestamped progress updates
- Create quick notes
- Set/change due dates
- View activity history

#### Progress Tracking
For tasks with measurable goals:
- Manual input field shows current/total (e.g. 12/50)  
- Visual progress bar updates automatically
- Add updates with specific progress values
- System tracks progress history

### Weekly Management

#### Week Navigation
- Use arrow buttons to view past/future weeks
- Current week shows in header with date range
- Tasks automatically filter by selected week

#### Weekly Rollover
At the end of each week:
- Incomplete Life Admin/Work tasks automatically move to next week
- Weekly Recurring tasks create fresh copies for new week
- Completed tasks remain in the previous week's archive

## 🌐 Deployment

### Deploy to Netlify (Free)

#### Option 1: Drag & Drop
1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to Netlify deploy area
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

#### Option 2: Git Integration
1. Push code to GitHub/GitLab
2. Connect repository to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard

Your app will be live at `https://your-app-name.netlify.app`!

## 🔧 Configuration

### Environment Variables
```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand  
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Deployment**: Netlify
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📄 Database Schema

The app uses 4 main tables:

- **tasks**: Main task records with category, status, progress
- **subtasks**: Checkable sub-items for each task  
- **task_updates**: Timestamped progress updates
- **notes**: Quick notes attached to tasks

See `supabase/schema.sql` for complete schema.

## 🆘 Troubleshooting

### Common Issues

#### Build Errors
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check all environment variables are set

#### Supabase Connection Issues  
- Verify URL and anon key in `.env.local`
- Ensure database tables are created from `schema.sql`
- Check Supabase project is not paused (free tier)

#### Parser Not Working
- Ensure text follows supported formats (numbered lists, clear task separation)
- Try simpler input first, then more complex
- Check browser console for parsing errors

---

**Built for personal productivity, powered by modern web technologies.**