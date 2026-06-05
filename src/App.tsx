import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import Customers from './pages/Customers'
import Winback from './pages/Winback'
import Jobs from './pages/Jobs'
import Settings from './pages/Settings'
import Guide from './pages/Guide'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="invoices"  element={<Invoices />} />
        <Route path="customers" element={<Customers />} />
        <Route path="winback"   element={<Winback />} />
        <Route path="jobs"      element={<Jobs />} />
        <Route path="settings"  element={<Settings />} />
        <Route path="guide"     element={<Guide />} />
      </Route>
    </Routes>
  )
}
