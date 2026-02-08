import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import EventRegistrationPage from './pages/EventRegistrationPage'
import CalendarPage from './pages/CalendarPage'
import DiscoverPage from './pages/DiscoverPage'
import DashboardPage from './pages/DashboardPage'
import DashboardRegistrationsPage from './pages/DashboardRegistrationsPage'
import DashboardEventRegistrationsPage from './pages/DashboardEventRegistrationsPage'
import EventBroadcastPage from './pages/EventBroadcastPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CreateEventPage from './pages/CreateEventPage'
import EditEventPage from './pages/EditEventPage'
import EditProfilePage from './pages/EditProfilePage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="event/:id" element={<EventDetailPage />} />
        <Route path="event/:id/registration" element={<EventRegistrationPage />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="event/:id/edit" element={<EditEventPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/registrations" element={<DashboardRegistrationsPage />} />
        <Route path="dashboard/events/:id/registrations" element={<DashboardEventRegistrationsPage />} />
        <Route path="dashboard/events/:eventId/broadcast" element={<EventBroadcastPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
