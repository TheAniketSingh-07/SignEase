# SignEase – Sign Language & Speech-to-Text Classroom Assistant

**Making Every Classroom Inclusive, Accessible, and Interactive.**

SignEase is an accessibility-first educational platform designed to bridge communication gaps between teachers and students, particularly deaf and hard-of-hearing learners. It combines real-time speech-to-text transcription, browser-based hand gesture recognition, interactive classroom tools, and AI-powered learning assistance to create a more inclusive digital learning environment.

🌐 **Live Demo:** https://signease07.vercel.app

💻 **GitHub Repository:** [https://github.com/TheAniketSingh-07/SignEase]

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-project-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Hand Gesture Recognition](#-hand-gesture-recognition)
- [Authentication and Database](#-authentication-and-database)
- [Accessibility Features](#-accessibility-features)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Environment Variables](#-environment-variables)
- [Google OAuth Configuration](#-google-oauth-configuration)
- [Deployment](#-deployment)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 🚀 Overview

Traditional classrooms primarily depend on spoken communication, which can create barriers for deaf, hard-of-hearing, and speech-impaired students.

SignEase addresses this challenge through an integrated digital classroom where teachers can conduct lectures while students receive live captions, communicate through predefined hand gestures, participate in interactive activities, and access shared learning resources.

The platform provides separate Teacher and Student portals with secure authentication and code-based classroom access.

SignEase aims to make inclusive education more practical through accessible technology and real-time communication.

## 🎯 Problem Statement

Students with hearing or speech disabilities often face difficulties in understanding lectures, communicating with instructors, and participating in classroom discussions.

Existing classroom solutions may require dedicated interpreters, additional hardware, or expensive accessibility services.

**SignEase provides a technology-driven approach to this problem by integrating:**

- Real-time speech-to-text conversion.
- Browser-based hand gesture recognition.
- Two-way classroom interaction.
- Live learning activities and feedback.
- Accessibility-focused interface customization.
- AI-assisted lecture understanding.

## 🎯 Project Objectives

1. Make classroom communication more accessible for students with hearing and speech disabilities.
2. Convert teachers' spoken lectures into real-time text captions.
3. Enable students to communicate using recognizable hand gestures.
4. Provide secure and separate Teacher and Student dashboards.
5. Support interactive classroom activities such as polls and quizzes.
6. Enable sharing of lecture notes and educational resources.
7. Improve learning experiences through AI-powered assistance.
8. Provide customizable accessibility settings for different learning requirements.

## ✨ Key Features

### 1. Role-Based Authentication

- Separate registration and login for Teachers and Students.
- Email and password authentication.
- Google OAuth sign-in support.
- Role-based dashboards and navigation.
- Protected application routes.
- Authentication session management.

### 2. Teacher Portal

Teachers can:

- Create and manage classrooms.
- Generate unique 7-character classroom codes.
- Start and manage live classroom sessions.
- Monitor participating students.
- Receive student gesture notifications.
- Broadcast live lecture captions.
- Create interactive polls and quizzes.
- Share lecture notes and PDF resources.
- Review student participation and responses.

### 3. Student Portal

Students can:

- Join classrooms using a unique classroom code.
- Access live classroom sessions.
- View real-time speech captions.
- Send feedback through hand gestures.
- Participate in polls and quizzes.
- Access shared lecture documents.
- View classroom history and learning resources.
- Customize accessibility preferences.

### 4. Real-Time Speech-to-Text

SignEase uses the browser's Web Speech API to capture spoken lecture content and convert it into text.

Key capabilities:

- Continuous speech recognition.
- Live interim transcription.
- Real-time caption updates.
- Support for accessible lecture viewing.
- Caption display designed for students with hearing difficulties.

### 5. AI-Powered Hand Gesture Recognition

The application integrates Google MediaPipe Hands for browser-based hand landmark detection.

- Tracks 21 hand landmarks.
- Recognizes 8 predefined classroom gestures.
- Processes hand movements directly in the browser.
- Uses a gesture stability mechanism to reduce accidental triggers.
- Sends gesture-based feedback to the teacher interface.

### 6. Interactive Polls and Quizzes

- Teachers can create multiple-choice polls.
- Timed quizzes with countdown functionality.
- Students can submit answers during live sessions.
- Dynamic response and percentage updates.
- Automated quiz score feedback.

### 7. Lecture Resource Sharing

- Teachers can share lecture PDFs and educational documents.
- Students receive access to shared resources.
- Documents can be viewed and downloaded.
- Resources remain associated with classroom sessions.

### 8. SignEase Virtual Agent (SEVA)

An AI-powered conversational assistant integrated into the platform to guide users and provide assistance with the application's learning and accessibility workflows.

### 9. Accessibility Customization

SignEase provides accessibility-oriented settings, including:

- Dynamic font-size adjustment.
- High-contrast themes.
- Dyslexia-friendly typography.
- Configurable speech settings.
- Gesture sensitivity preferences.
- Sound alerts and visual notifications.
- Caption background opacity customization.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend Framework | Next.js (App Router) |
| UI Library | React.js |
| Styling | Tailwind CSS |
| Programming Language | JavaScript |
| Database | Supabase / PostgreSQL |
| Authentication | Supabase Auth and application authentication |
| OAuth | Google OAuth |
| Computer Vision | Google MediaPipe Hands |
| Speech Recognition | Web Speech API |
| Real-Time Communication | Server-Sent Events (SSE), BroadcastChannel |
| Backend | Next.js Route Handlers / API Routes |
| AI Integration | LLM-based API integration |
| Hosting | Vercel |
| Version Control | Git and GitHub |
| Development Tools | VS Code, Browser Developer Tools |

---

## 🏗️ System Architecture

SignEase follows a modular, event-driven client-server architecture using Next.js App Router.

### Application Layers

**1. Presentation Layer**
- Next.js and React components.
- Teacher and Student dashboards.
- Responsive and accessible user interfaces.

**2. Application Layer**
- Next.js Route Handlers.
- Authentication and authorization.
- Classroom management.
- Poll and quiz processing.
- Gesture and transcript event handling.

**3. Data Layer**
- Supabase PostgreSQL database.
- User profiles and roles.
- Classroom records.
- Transcripts and gesture events.
- Polls, quizzes, and learning resources.

**4. Real-Time Communication Layer**
- Server-Sent Events.
- BroadcastChannel.
- Classroom event synchronization.

**5. AI and Recognition Layer**
- Web Speech API.
- MediaPipe Hands.
- AI-powered conversational assistance.
- Automated lecture summarization.

### Data Flow

**Speech Recognition:**

Teacher Speech → Web Speech API → Text Transcription → Real-Time Communication → Student Caption Display

**Gesture Recognition:**

Student Hand Movement → MediaPipe Hands → Landmark Detection → Gesture Classification → Classroom Event → Teacher Notification

**Classroom Interaction:**

Teacher Creates Poll/Quiz → API Request → Database Operations → Student Participation → Results and Feedback

---

## 🤖 Hand Gesture Recognition

SignEase supports eight predefined classroom gestures.

| Gesture | Classroom Action |
|---|---|
| Question | Sends a question notification |
| Raise Hand | Requests permission to speak |
| Understood | Indicates understanding |
| Need Help | Requests instructor assistance |
| Yes / Agree | Expresses agreement |
| No / Disagree | Expresses disagreement |
| Slow Down | Requests slower teaching |
| Great Lecture | Sends positive feedback |

### Gesture Recognition Process

1. The browser accesses the camera after user permission.
2. MediaPipe Hands detects hand landmarks.
3. The system tracks 21 hand landmark points.
4. Finger positions and landmark relationships are analysed.
5. The gesture classifier identifies a supported gesture.
6. A 0.6-second stability threshold helps prevent accidental triggers.
7. The recognized gesture is transmitted to the classroom interface.

The recognition pipeline runs on the client side, reducing the need to send raw camera frames to an external recognition server.

---

## 🔐 Authentication and Database

SignEase uses role-based authentication to provide different experiences for teachers and students.

### Authentication

- Teacher and Student account registration.
- Email and password login.
- Google OAuth integration.
- Role-based access control.
- Authentication callback handling.
- Session management.

### Database Entities

The application manages the following primary data entities:

| Entity | Purpose |
|---|---|
| Profiles | User information and roles |
| Classrooms | Classroom codes, teachers and session information |
| Transcripts | Lecture transcription records |
| Gestures | Student gesture events |
| Polls | Classroom polls and responses |
| Quizzes | Quiz questions, timers and answers |
| Resources | Shared lecture documents and metadata |

Supabase provides PostgreSQL database capabilities and authentication integration.

---

## ♿ Accessibility Features

Accessibility is a central design principle of SignEase.

The platform incorporates accessibility-oriented features inspired by WCAG 2.1 AA guidelines.

- Readable typography and dynamic font scaling.
- High-contrast interface options.
- Dyslexia-friendly font settings.
- Visual and auditory notifications.
- Customizable speech recognition preferences.
- Gesture sensitivity controls.
- Adjustable caption backgrounds.
- Separate communication workflows for teachers and students.

These features aim to make classroom participation more comfortable for learners with different accessibility requirements.

---

## 📂 Project Structure

The project follows the Next.js App Router architecture.

```text
signease/
│
├── public/
│   ├── images/
│   └── assets/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   └── classrooms/
│   │   │
│   │   ├── classroom/
│   │   ├── teacher/
│   │   ├── student/
│   │   ├── settings/
│   │   ├── layout.js
│   │   └── page.js
│   │
│   ├── components/
│   │   └── UI and reusable components
│   │
│   └── lib/
│       ├── server/
│       └── supabase/
│           ├── client.js
│           ├── hybridStore.js
│           └── utils.js
│
├── supabase/
│   └── schema.sql
│
├── .env.example
├── package.json
├── next.config.js
└── README.md
```

*Note: This is a representative project structure. Folder names may differ depending on the latest repository implementation.*

---

## ⚙️ Installation and Setup

Follow these steps to run SignEase locally.

### Prerequisites

Make sure you have installed:

- Node.js (LTS version).
- npm.
- Git.
- A modern browser (Google Chrome recommended).
- Supabase project and credentials.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/signease.git
```

### 2. Navigate to the Project Directory

```bash
cd signease
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Add any additional AI provider or server-side credentials required by your actual project configuration.

### 5. Configure the Supabase Database

1. Open your Supabase project.
2. Navigate to the SQL Editor.
3. Open the project's `supabase/schema.sql` file.
4. Execute the required SQL statements.
5. Verify that the required tables and policies have been created.

### 6. Start the Development Server

```bash
npm run dev
```

### 7. Open the Application

Visit:

```text
http://localhost:3000
```

**Recommended:** Use Google Chrome and allow camera and microphone permissions when prompted.

---

## 🔑 Google OAuth Configuration

To enable Google sign-in:

1. Open the Supabase Dashboard.
2. Navigate to Authentication → Providers.
3. Enable Google authentication.
4. Configure your Google OAuth Client ID and Client Secret.
5. Add the Supabase callback URL to your Google Cloud OAuth configuration.
6. Add your local and deployed application URLs to the Supabase redirect URL allowlist.
7. Save the configuration and test Google sign-in.

Never expose OAuth client secrets or other private credentials in frontend code or GitHub.

---

## 🌐 Deployment

SignEase is deployed using Vercel.

**Live Application:** https://signease-zeta.vercel.app

Deployment considerations:

- Configure the production environment variables.
- Configure the production Supabase URL and authentication redirects.
- Ensure database policies and authentication are correctly configured.
- Verify classroom creation and cross-device classroom joining.
- Test camera and microphone permissions.
- Verify real-time communication in the production environment.

---

## 🔮 Future Enhancements

Potential improvements to SignEase include:

- Advanced sign language recognition with larger gesture vocabularies.
- Support for multiple regional sign languages.
- Multilingual speech-to-text transcription.
- Text-to-speech functionality for improved communication.
- AI-powered personalized learning recommendations.
- Advanced classroom analytics and participation reports.
- Recorded lectures with searchable transcripts.
- Improved mobile accessibility and offline support.
- More robust real-time synchronization and classroom recovery.

---

## 🤝 Contributing

Contributions, suggestions, and feature improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your implementation.
5. Submit a Pull Request with a clear description.

---

## 👨‍💻 Author

**Aniket Singh**
Team Members - **Sahil, Shubham**

B.Tech – Computer Science and Engineering  
Lovely Professional University (LPU), Punjab, India

**Project:** SignEase – Sign Language & Speech-to-Text Classroom Assistant

- Portfolio: https://theaniketsingh.netlify.app/

---

## 📄 License

This project is developed for academic and educational purposes.

A formal open-source license can be added by including a `LICENSE` file in the repository.

---

**SignEase – Same Classroom. Same Knowledge. Equal Opportunities.**

*Technology should not be a barrier to education. It should make education accessible to everyone.*
