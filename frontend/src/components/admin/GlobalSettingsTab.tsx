import React, { useState, useEffect } from 'react';
import { AdminSystemSetting, getSystemSettings, updateSystemSetting } from '../../lib/services/admin';
import { Settings, Save, CheckCircle2, Shield } from 'lucide-react';

interface GlobalSettingsTabProps {
  settings?: AdminSystemSetting[];
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function GlobalSettingsTab({ settings, theme, refreshData }: GlobalSettingsTabProps) {
  const isLight = theme === 'light';
  const [serviceFee, setServiceFee] = useState('2.5');
  const [minEscrowAmount, setMinEscrowAmount] = useState('1000');
  const [systemMode, setSystemMode] = useState('active');
  const [payoutThreshold, setPayoutThreshold] = useState('5000');
  const [referralBonus, setReferralBonus] = useState('200');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (settings) {
      const feeSetting = settings.find(s => s.key === 'serviceFee');
      if (feeSetting?.value) setServiceFee(String(feeSetting.value));

      const minAmountSetting = settings.find(s => s.key === 'minEscrowAmount');
      if (minAmountSetting?.value) setMinEscrowAmount(String(minAmountSetting.value));

      const modeSetting = settings.find(s => s.key === 'systemMode');
      if (modeSetting?.value) setSystemMode(String(modeSetting.value));

      const payoutThresholdSetting = settings.find(s => s.key === 'payoutThreshold');
      if (payoutThresholdSetting?.value) setPayoutThreshold(String(payoutThresholdSetting.value));

      const referralBonusSetting = settings.find(s => s.key === 'referralBonus');
      if (referralBonusSetting?.value) setReferralBonus(String(referralBonusSetting.value));

      const emailNotificationsSetting = settings.find(s => s.key === 'emailNotifications');
      if (emailNotificationsSetting?.value !== undefined) setEmailNotifications(Boolean(emailNotificationsSetting.value));

      const smsNotificationsSetting = settings.find(s => s.key === 'smsNotifications');
      if (smsNotificationsSetting?.value !== undefined) setSmsNotifications(Boolean(smsNotificationsSetting.value));
    }
  }, [settings]);

  const handleSave = async (key: string, value: any) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await updateSystemSetting(key, value);
      if (refreshData) refreshData();
    } catch (err) {
      console.error(`Error saving ${key}:`, err);
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800 shadow-lg'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-500/10'}`}>
            <Settings className={`w-6 h-6 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>Global System Settings</h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Manage platform-wide configurations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Service Fee */}
          <div className={`p-5 rounded-xl border ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>Service Fee</h4>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'}`}>% per transaction</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="0.1"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}
              />
              <span className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>%</span>
              <button
                onClick={() => handleSave('serviceFee', Number(serviceFee))}
                disabled={saving['serviceFee']}
                className={`px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${isLight ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'}`}
              >
                {saving['serviceFee'] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Minimum Escrow Amount */}
          <div className={`p-5 rounded-xl border ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>Minimum Escrow Amount</h4>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-400'}`}>NGN</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>₦</span>
              <input
                type="number"
                value={minEscrowAmount}
                onChange={(e) => setMinEscrowAmount(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}
              />
              <button
                onClick={() => handleSave('minEscrowAmount', Number(minEscrowAmount))}
                disabled={saving['minEscrowAmount']}
                className={`px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${isLight ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'}`}
              >
                {saving['minEscrowAmount'] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Minimum Payout Threshold */}
          <div className={`p-5 rounded-xl border ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>Minimum Payout Threshold</h4>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/10 text-purple-400'}`}>NGN</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>₦</span>
              <input
                type="number"
                value={payoutThreshold}
                onChange={(e) => setPayoutThreshold(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}
              />
              <button
                onClick={() => handleSave('payoutThreshold', Number(payoutThreshold))}
                disabled={saving['payoutThreshold']}
                className={`px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${isLight ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'}`}
              >
                {saving['payoutThreshold'] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Referral Bonus */}
          <div className={`p-5 rounded-xl border ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>Referral Bonus</h4>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>NGN</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>₦</span>
              <input
                type="number"
                value={referralBonus}
                onChange={(e) => setReferralBonus(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}
              />
              <button
                onClick={() => handleSave('referralBonus', Number(referralBonus))}
                disabled={saving['referralBonus']}
                className={`px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${isLight ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'}`}
              >
                {saving['referralBonus'] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* System Mode */}
          <div className={`p-5 rounded-xl border ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>System Mode</h4>
              <Shield className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSystemMode('active');
                  handleSave('systemMode', 'active');
                }}
                disabled={saving['systemMode']}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                  systemMode === 'active'
                    ? isLight
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : isLight
                      ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {systemMode === 'active' && <CheckCircle2 className="w-4 h-4 inline mr-2" />}
                Active
              </button>
              <button
                onClick={() => {
                  setSystemMode('maintenance');
                  handleSave('systemMode', 'maintenance');
                }}
                disabled={saving['systemMode']}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                  systemMode === 'maintenance'
                    ? isLight
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                    : isLight
                      ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {systemMode === 'maintenance' && <CheckCircle2 className="w-4 h-4 inline mr-2" />}
                Maintenance
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className={`p-5 rounded-xl border ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>Notifications</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-zinc-900/30">
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>Email Notifications</p>
                  <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Send emails to users</p>
                </div>
                <button
                  onClick={() => {
                    setEmailNotifications(!emailNotifications);
                    handleSave('emailNotifications', !emailNotifications);
                  }}
                  disabled={saving['emailNotifications']}
                  className={`relative w-14 h-7 rounded-full transition-colors ${emailNotifications ? (isLight ? 'bg-emerald-500' : 'bg-emerald-500') : (isLight ? 'bg-zinc-300' : 'bg-zinc-700')}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow-sm ${emailNotifications ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-zinc-900/30">
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>SMS Notifications</p>
                  <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Send SMS to users</p>
                </div>
                <button
                  onClick={() => {
                    setSmsNotifications(!smsNotifications);
                    handleSave('smsNotifications', !smsNotifications);
                  }}
                  disabled={saving['smsNotifications']}
                  className={`relative w-14 h-7 rounded-full transition-colors ${smsNotifications ? (isLight ? 'bg-emerald-500' : 'bg-emerald-500') : (isLight ? 'bg-zinc-300' : 'bg-zinc-700')}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow-sm ${smsNotifications ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
