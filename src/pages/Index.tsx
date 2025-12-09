import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, roleRedirects } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isInitializing } = useAuth() as any;

  useEffect(() => {
    if (isInitializing) {
      return; // Wait for auth to initialize
    }

    if (isAuthenticated && user) {
      navigate(roleRedirects[user.role]);
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, user, isInitializing, navigate]);

  return null;
};

export default Index;
