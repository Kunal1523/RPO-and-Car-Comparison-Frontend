import React, { useState } from 'react';
import { X, Mail, Send } from 'lucide-react';
import { api } from '../apiService/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  accessToken?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, userEmail, accessToken = "" }) => {
  const [tenantUsers, setTenantUsers] = useState<{ email: string, name: string }[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // ✅ manual entry support
  const [manualEmailsText, setManualEmailsText] = useState("");
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string>("");

  const [subject, setSubject] = useState('Final Plan Export');
  const [body, setBody] = useState('Please find attached the Final Plan.');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load tenant users on open
  React.useEffect(() => {
    if (isOpen && userEmail && accessToken) {
      api.fetchTenantUsers(userEmail, accessToken)
        .then(users => setTenantUsers(users))
        .catch(err => console.error("Failed to load tenant users", err));
    }
  }, [isOpen, userEmail, accessToken]);

  if (!isOpen) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const parseEmails = (text: string) => {
    // allow comma, semicolon, space, newline
    const parts = text
      .split(/[\s,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    // unique
    return Array.from(new Set(parts));
  };

  const validateEmails = (emails: string[]) => {
    const invalid = emails.filter(e => !emailRegex.test(e));
    return invalid;
  };

  const allRecipients = Array.from(new Set([...selectedEmails, ...manualEmails]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      // ✅ validate recipients
      if (allRecipients.length === 0) {
        setEmailError("Please add at least one recipient.");
        setLoading(false);
        return;
      }
      if (emailError) {
        setLoading(false);
        return;
      }

      await api.shareFinalPlan(allRecipients, subject, body, userEmail, accessToken);
      setStatus('success');

      setTimeout(() => {
        onClose();
        setStatus('idle');
        setSelectedEmails([]);
        setManualEmailsText("");
        setManualEmails([]);
        setEmailError("");
        setSubject('Final Plan Export');
        setBody('Please find attached the Final Plan.');
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            Share Final Plan
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

          {/* ✅ NEW: manual email entry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add recipients (type any email)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={manualEmailsText}
              onChange={(e) => {
                const text = e.target.value;
                setManualEmailsText(text);

                const parsed = parseEmails(text);
                setManualEmails(parsed);

                const invalid = validateEmails(parsed);
                setEmailError(invalid.length ? `Invalid email(s): ${invalid.join(", ")}` : "");
              }}
              placeholder="e.g. user1@contoso.com, user2@contoso.com"
            />

            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}

            {!emailError && manualEmails.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Added: {manualEmails.length} email(s)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients (Tenant Users)
            </label>
            <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50">
              {tenantUsers.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-2">No tenant users found. Check DB or config.</p>
              ) : (
                tenantUsers.map(u => (
                  <label key={u.email} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(u.email)}
                      onChange={() => toggleEmail(u.email)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{u.name}</span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="mt-1 text-xs text-blue-600">
              Selected: {allRecipients.length} recipients
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none h-24"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>

          {status === 'success' && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
              <Send className="w-4 h-4" />
              Email sent successfully!
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              Failed to send email. Please try again.
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || allRecipients.length === 0 || !!emailError || !subject}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? 'Sending...' : 'Send Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
