/**
 * Partner login page
 */
import { LoginForm } from '@/components/auth';

export const metadata = {
  title: 'Partner Login | Helix Insight',
  description: 'Sign in to access your Helix Insight dashboard',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-8 left-8">
        <a href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Back to home</span>
        </a>
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
