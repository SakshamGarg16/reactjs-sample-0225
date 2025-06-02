import ProtectedRoute from '../../components/ProctedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <p>This is your profile page.</p>
        {/* Your profile content here */}
      </div>
    </ProtectedRoute>
  );
}
