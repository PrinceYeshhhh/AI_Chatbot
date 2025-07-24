import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TTSButton } from '../tts/TTSButton';
import { toggleHighContrast } from '../accessibility/accessibilityHelpers';
import { OnboardingWalkthrough } from '../onboarding/OnboardingWalkthrough';
import { getUserSettings, updateUserSettings, generateApiKey, getUserSubscription } from '../services/analyticsService';
import { ApiKeyManager } from '../developerTools/ApiKeyManager';
import { useAuth } from '../context/AuthContext';

const MODEL_OPTIONS = [
  { value: 'claude-3', label: 'Claude 3 (Anthropic)' },
  { value: 'local', label: 'Local Model (Mistral/LLaMA)' },
];

const TABS = [
  { label: 'General' },
  { label: 'Privacy & Security' },
];

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { t, i18n } = useTranslation();
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState('default');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [adminOnlyModelSelection, setAdminOnlyModelSelection] = useState(false);
  const { user } = useAuth();
  const [userRole, setUserRole] = useState('user');
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [contextLimit, setContextLimit] = useState<number>(4000);

  // --- Multilingual & Voice Settings ---
  const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ru', label: 'Русский' },
    { value: 'ar', label: 'العربية' },
    { value: 'pt', label: 'Português' },
    { value: 'it', label: 'Italiano' },
    { value: 'ko', label: '한국어' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'pl', label: 'Polski' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'sv', label: 'Svenska' },
    { value: 'fi', label: 'Suomi' },
    { value: 'no', label: 'Norsk' },
    { value: 'da', label: 'Dansk' },
    { value: 'cs', label: 'Čeština' },
    { value: 'el', label: 'Ελληνικά' },
    { value: 'he', label: 'עברית' },
    { value: 'th', label: 'ไทย' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'id', label: 'Bahasa Indonesia' },
    // ... add more as needed for 100+ languages
  ];
  const VOICE_GENDERS = [
    { value: 'neutral', label: 'Neutral' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
  ];
  const VOICE_PROVIDERS = [
    { value: 'native', label: 'Browser Native' },
    { value: 'elevenlabs', label: 'ElevenLabs' },
  ];

  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [voiceGender, setVoiceGender] = useState('neutral');
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceProvider, setVoiceProvider] = useState('native');
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      // (Replace all supabase.* calls with backend API and Clerk.dev logic)
      // Optionally fetch user role from workspace/org context
      setUserRole(user?.role || 'user');
    }
    async function fetchPlan() {
      if (!user?.id) return;
      try {
        const { data } = await getUserSubscription(user.id);
        if (data && data.plan_type) {
          setUserPlan(data.plan_type);
          setContextLimit(data.plan_type === 'pro' ? 16000 : data.plan_type === 'enterprise' ? 32000 : 4000);
        }
      } catch {}
    }
    if (user?.id) fetchSettings();
    if (user?.id) fetchPlan();
    getUserSettings().then(settings => {
      if (settings) {
        setTtsEnabled(!!settings.tts_enabled);
        setAccessibilityMode(settings.accessibility_mode || 'default');
        if (settings.preferred_language) i18n.changeLanguage(settings.preferred_language);
      }
    });
  }, [user]);

  useEffect(() => {
    // Fetch user multilingual/voice preferences
    async function fetchPrefs() {
      setLoadingPrefs(true);
      const { data } = await getUserSettings();
      if (data) {
        setPreferredLanguage(data.preferred_language || 'en');
        setAutoTranslate(data.auto_translate_enabled ?? true);
        setVoiceGender(data.voice_gender || 'neutral');
        setVoiceRate(data.voice_rate ?? 1.0);
        setVoicePitch(data.voice_pitch ?? 1.0);
        setVoiceProvider(data.voice_provider || 'native');
      }
      setLoadingPrefs(false);
    }
    fetchPrefs();
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const handleSave = async () => {
    setSaving(true);
    // (Replace all supabase.* calls with backend API and Clerk.dev logic)
    setSaving(false);
    onClose();
  };

  const handleSaveMultilingualVoice = async () => {
    setSaving(true);
    // (Replace all supabase.* calls with backend API and Clerk.dev logic)
    setSaving(false);
    onClose();
  };

  const handleSaveSettings = async () => {
    // (Replace all supabase.* calls with backend API and Clerk.dev logic)
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex border-b mb-4">
        {TABS.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 ${activeTab === idx ? 'border-b-2 border-blue-600 font-bold' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 0 && (
        <div className="mb-4">
          <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-100">
            <span className="font-bold text-blue-900">Your Plan:</span> <span className="text-blue-700">{userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}</span>
            <span className="ml-4 font-bold text-blue-900">Context Window:</span> <span className="text-blue-700">{contextLimit.toLocaleString()} tokens</span>
          </div>
          <label className="block font-medium mb-1">LLM Model</label>
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="border rounded px-2 py-1 w-full"
            disabled={adminOnlyModelSelection && userRole !== 'admin'}
          >
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
      {activeTab === 1 && (
        <div>
          <h3 className="font-semibold mb-2">Session Logs</h3>
          {/* TODO: List active sessions/devices */}
          <div className="mb-4">No session logs yet.</div>
          <h3 className="font-semibold mb-2">{t('language')}</h3>
          <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} className="min-w-[48px] min-h-[48px]" aria-label="Select language">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
          <h3 className="font-semibold mt-4 mb-2">{t('tts')}</h3>
          <label>
            <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} className="min-w-[48px] min-h-[48px]" aria-label="Enable text-to-speech" /> {t('auto_read')}
          </label>
          <h3 className="font-semibold mt-4 mb-2">{t('accessibility_mode')}</h3>
          <label>
            <input type="checkbox" checked={accessibilityMode === 'high-contrast'} onChange={e => {
              const mode = e.target.checked ? 'high-contrast' : 'default';
              setAccessibilityMode(mode);
              toggleHighContrast(mode === 'high-contrast');
            }} className="min-w-[48px] min-h-[48px]" aria-label="Enable high contrast mode" /> {t('high_contrast')}
          </label>
          <h3 className="font-semibold mb-2">🌐 Multilingual Settings</h3>
          {loadingPrefs ? <div>Loading language preferences...</div> : (
            <>
              <label className="block font-medium mb-1">Language</label>
              <select value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} className="border rounded px-2 py-1 w-full mb-2">
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label className="block font-medium mb-1">Auto-translate</label>
              <input type="checkbox" checked={autoTranslate} onChange={e => setAutoTranslate(e.target.checked)} className="mr-2" />
              <span>Enable automatic translation of chat</span>
            </>
          )}
          <h3 className="font-semibold mt-4 mb-2">🔊 Voice Settings</h3>
          <label className="block font-medium mb-1">Voice Gender</label>
          <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)} className="border rounded px-2 py-1 w-full mb-2">
            {VOICE_GENDERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label className="block font-medium mb-1">Voice Rate</label>
          <input type="number" min={0.5} max={2} step={0.1} value={voiceRate} onChange={e => setVoiceRate(Number(e.target.value))} className="border rounded px-2 py-1 w-full mb-2" />
          <label className="block font-medium mb-1">Voice Pitch</label>
          <input type="number" min={0.5} max={2} step={0.1} value={voicePitch} onChange={e => setVoicePitch(Number(e.target.value))} className="border rounded px-2 py-1 w-full mb-2" />
          <label className="block font-medium mb-1">Voice Provider</label>
          <select value={voiceProvider} onChange={e => setVoiceProvider(e.target.value)} className="border rounded px-2 py-1 w-full mb-2">
            {VOICE_PROVIDERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4 min-w-[48px] min-h-[48px]" onClick={handleSaveMultilingualVoice} disabled={saving} aria-label="Save multilingual and voice settings">{saving ? 'Saving...' : 'Save Multilingual & Voice Settings'}</button>
          <button className="bg-gray-200 px-3 py-1 rounded mt-4 ml-2 min-w-[48px] min-h-[48px]" onClick={() => setShowOnboarding(true)} aria-label="Start onboarding">{t('start_onboarding')}</button>
          {showOnboarding && <OnboardingWalkthrough />}
          <ApiKeyManager />
          <h3 className="font-semibold mb-2">GDPR/CCPA Tools</h3>
          <button className="bg-gray-200 px-3 py-1 rounded mr-2">Download My Data</button>
          <button className="bg-gray-200 px-3 py-1 rounded">Request Forget Me</button>
        </div>
      )}
    </div>
  );
} 