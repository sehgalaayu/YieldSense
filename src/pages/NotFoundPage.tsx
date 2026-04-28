import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-black text-[#1E3A5F] font-['Syne']">404</p>
        <h1 className="text-2xl font-bold text-[#F1F5F9] mt-4">Page not found</h1>
        <p className="text-[#64748B] mt-2">This page doesn't exist.</p>
        <button onClick={() => navigate('/')} 
          className="mt-6 px-6 py-3 bg-[#F59E0B] text-black font-bold rounded-lg hover:bg-[#D97706] transition-all">
          Go to WealthSense →
        </button>
      </div>
    </div>
  );
}
