# EasyCeipt

A modern web application built with Next.js, Flask, and Supabase.

## Tech Stack

- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: Flask (Python)
- Database: Supabase (PostgreSQL)
- Deployment: Vercel (Frontend) & TBD (Backend)

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8 or higher
- npm or yarn
- A Supabase account

### Quick Start
The easiest way to start development is to use our provided scripts in the `bin` directory:

```bash
# Start both frontend and backend servers
./bin/start-dev.sh

# Or start them individually:
./bin/start-frontend.sh  # For Next.js frontend only
./bin/start-backend.sh   # For Flask backend only
```

### Manual Setup

#### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Start the development server:
```bash
npm run dev
```

#### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-service-key
FLASK_SECRET_KEY=your-flask-secret-key
```

5. Start the Flask server:
```bash
python app.py
```

## Development

The frontend will be available at `http://localhost:3000`
The backend API will be available at `http://localhost:5000`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
