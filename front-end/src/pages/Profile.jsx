// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { Camera, Settings, User, Mail, Shield, Bell } from 'lucide-react';

export default function Profile({ username }) {
  const [profile, setProfile] = useState(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://127.0.0.1:8001/api/v1/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setTempBio(data.bio || "");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveBio = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch("http://127.0.0.1:8001/api/v1/users/me", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ bio: tempBio })
    });
    if (response.ok) {
      const updated = await response.json();
      setProfile(updated);
      setIsEditingBio(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const endpoint = type === 'profile' ? 'upload-profile-pic' : 'upload-cover-pic';
    
    const response = await fetch(`http://127.0.0.1:8001/api/v1/users/${endpoint}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (response.ok) fetchProfile();
  };

  const handleTogglePreference = async (key, currentValue) => {
    const token = localStorage.getItem('token');
    const newSettings = { [key]: !currentValue };
    
    const response = await fetch("http://127.0.0.1:8001/api/v1/users/me", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ settings: newSettings })
    });
    if (response.ok) {
      const updated = await response.json();
      setProfile(updated);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("PERMANENT ACTION: This will delete your account and all associated data. Proceed?")) return;
    
    const token = localStorage.getItem('token');
    const response = await fetch("http://127.0.0.1:8001/api/v1/users/me", {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  if (isLoading || !profile) {
    return <div className="p-20 text-center text-slate-500 animate-pulse">Synchronizing Neural Node...</div>;
  };

  const getImageUrl = (path, fallback) => {
    if (!path) return fallback;
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8001/${path}`;
  };

  const settings = profile.settings || {};

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fadeIn">
      {/* Cover Page */}
      <div className="relative h-64 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
        <img 
          src={getImageUrl(profile.cover_pic, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000&h=300')} 
          alt="Cover" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        <label className="absolute top-4 right-4 p-2 bg-slate-900/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-slate-700 hover:bg-blue-600 hover:border-blue-500">
          <Camera className="w-5 h-5" />
          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" />
        </label>
      </div>

      {/* Profile Header */}
      <div className="relative px-8 -mt-16">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-slate-900 overflow-hidden shadow-2xl bg-slate-800">
              <img 
                src={getImageUrl(profile.profile_pic, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150')} 
                alt="Avatar" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              />
            </div>
            <label className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-500 transition-colors border-2 border-slate-900">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'profile')} accept="image/*" />
            </label>
          </div>
          
          <div className="flex-1 pb-2 text-center md:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight">{profile.username || 'Anonymous Node'}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-blue-400 font-mono text-[10px] uppercase tracking-widest">Active Synthesis Core</p>
            </div>
          </div>

          <div className="flex gap-2 pb-2">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer border border-slate-700 flex items-center gap-2 shadow-lg">
              <Settings className="w-3.5 h-3.5" /> Dashboard Options
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 px-2">
        {/* Left Column: Bio & Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-950/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="text-blue-500 w-4 h-4" /> Neural Biography
              </h2>
              {!isEditingBio && (
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 cursor-pointer transition-colors"
                >
                  Reconstruct Info
                </button>
              )}
            </div>
            
            {isEditingBio ? (
              <div className="space-y-4">
                <textarea 
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px] transition-all text-sm leading-relaxed"
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveBio}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Commit Changes
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingBio(false);
                      setTempBio(profile.bio || "");
                    }}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-400 transition-colors cursor-pointer border border-slate-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-300 leading-relaxed italic text-sm border-l-2 border-blue-500/30 pl-4 py-1">
                "{profile.bio || "Neural biography initialized. Awaiting user input..."}"
              </p>
            )}
          </section>

          <section className="bg-slate-950/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm shadow-xl">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Bell className="text-purple-500 w-4 h-4" /> Global Preferences
            </h2>
            <div className="space-y-4">
              {[
                { id: 'neural_alerts', label: 'Neural Alerts', desc: 'Notify when synthesis cycles complete.' },
                { id: 'broadcast_mode', label: 'Broadcast Mode', desc: 'Publicize generated drafts to the repository.' },
                { id: 'security_logs', label: 'Security Logs', desc: 'Email weekly access and generation audits.' }
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{pref.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                  </div>
                  <div 
                    onClick={() => handleTogglePreference(pref.id, settings[pref.id])}
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${settings[pref.id] ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${settings[pref.id] ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Account Settings Card */}
        <div className="space-y-6">
          <div className="bg-slate-950/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm shadow-xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Interface Security</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 bg-slate-900/80 rounded-2xl hover:bg-slate-800 transition-all border border-slate-800 group cursor-pointer text-left">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-300">Rotate Email</span>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-slate-900/80 rounded-2xl hover:bg-slate-800 transition-all border border-slate-800 group cursor-pointer text-left">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-300">Update Encryption</span>
                </div>
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800">
              <button 
                onClick={handleDeleteAccount}
                className="w-full p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-rose-500/20"
              >
                Sever Node Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}