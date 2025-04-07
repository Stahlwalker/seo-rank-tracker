import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ShareButton: React.FC = () => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [copied, setCopied] = useState(false);
    const { isAdmin } = useAuth();

    const handleShare = async () => {
        // Generate a unique token for the share link
        const token = btoa(Date.now().toString());
        const shareUrl = `${window.location.origin}/shared/${token}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="relative">
            <button
                onClick={handleShare}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 flex items-center"
            >
                {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">
                    {copied ? 'Copied!' : 'Share'}
                </span>
            </button>

            {showTooltip && !copied && (
                <div className="absolute right-0 mt-2 w-48 p-2 bg-gray-800 rounded-md shadow-lg text-sm text-gray-300">
                    Generate a read-only link to share with others
                </div>
            )}
        </div>
    );
};

export default ShareButton; 