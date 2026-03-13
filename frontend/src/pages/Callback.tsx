import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';

export default function Callback() {
  const navigate = useNavigate();
  useHandleSignInCallback(() => navigate('/dashboard'));

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
