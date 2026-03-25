import { useState, useRef } from "react";
import { ArrowLeft, Camera, Check, User } from "lucide-react";
import { AvatarCropModal } from "./AvatarCropModal";

interface EditProfilePageProps {
  onBack: () => void;
  currentName?: string;
  currentUsername?: string;
  currentBio?: string;
  currentAvatar?: string;
  onSave?: (data: { name: string; username: string; bio: string; avatar: string }) => void;
}

interface PendingCrop {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

export function EditProfilePage({
  onBack,
  currentName     = "Your Name",
  currentUsername = "username",
  currentBio      = "Creator & Designer\nSan Francisco, CA\nLiving my best life",
  currentAvatar   = "",   // blank by default — no stock photo
  onSave,
}: EditProfilePageProps) {
  const [name,       setName]       = useState(currentName);
  const [username,   setUsername]   = useState(currentUsername);
  const [bio,        setBio]        = useState(currentBio);
  const [avatar,     setAvatar]     = useState(currentAvatar);
  const [isLoading,  setIsLoading]  = useState(false);
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File picked → open crop modal ──────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';   // allow re-selecting same file
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPendingCrop({
        imageUrl:     objectUrl,
        naturalWidth:  img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      // Don't revoke yet — AvatarCropModal needs the URL until confirm/cancel
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  // ── Crop confirmed → apply data URL and clean up ───────────────────────────
  const handleCropConfirm = (croppedDataUrl: string) => {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.imageUrl);
    setPendingCrop(null);
    console.log(`📸 Avatar cropped: ${(croppedDataUrl.length / 1024).toFixed(0)} KB`);
    setAvatar(croppedDataUrl);
  };

  // ── Crop cancelled ────────────────────────────────────────────────────────
  const handleCropCancel = () => {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.imageUrl);
    setPendingCrop(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onSave) {
        onSave({ name, username, bio, avatar });
      } else {
        onBack();
      }
    }, 1000);
  };

  return (
    <div
      className="h-full flex flex-col bg-background relative"
      style={{ animation: 'pageSlideIn 0.35s cubic-bezier(.22,.68,0,1.2) both' }}
    >
      {/* ── Crop modal (portal-like, renders on top within the scaled container) */}
      {pendingCrop && (
        <AvatarCropModal
          imageUrl={pendingCrop.imageUrl}
          naturalWidth={pendingCrop.naturalWidth}
          naturalHeight={pendingCrop.naturalHeight}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 z-40 bg-background/80 backdrop-blur-xl border-b border-accent/20">
        <div className="flex items-center justify-between" style={{
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center hover:from-accent/20 hover:to-accent/10 transition-all"
          >
            <ArrowLeft className="text-accent" size={20} />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            Edit Profile
          </h1>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Check className="text-background" size={20} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-2xl mx-auto w-full" style={{
        paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
      }}>

        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Avatar circle */}
            <div className="w-28 h-28 rounded-full border-4 border-accent overflow-hidden bg-secondary/40 flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Blank silhouette when no avatar is set */
                <User className="text-muted-foreground/40" size={52} strokeWidth={1.5} />
              )}
            </div>

            {/* Hover overlay — selected element */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={28} />
              <span className="text-white text-[9px] font-black uppercase tracking-wider leading-none">
                {avatar ? 'Crop & Edit' : 'Add Photo'}
              </span>
            </div>

            {/* Small camera badge */}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full border-2 border-background flex items-center justify-center">
              <Camera className="text-background" size={16} />
            </div>
          </div>

          <p
            className="mt-3 text-sm font-medium text-accent cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatar ? 'Change Profile Photo' : 'Add Profile Photo'}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 rounded-2xl outline-none text-foreground focus:ring-2 focus:ring-accent/30 transition-all border border-transparent focus:border-accent/30"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 rounded-2xl outline-none text-foreground focus:ring-2 focus:ring-accent/30 transition-all border border-transparent focus:border-accent/30"
              placeholder="username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-secondary/50 rounded-2xl outline-none text-foreground focus:ring-2 focus:ring-accent/30 transition-all border border-transparent focus:border-accent/30 resize-none"
              placeholder="Write something about yourself..."
            />
            <p className="text-right text-xs text-muted-foreground">{bio.length}/150</p>
          </div>
        </div>
      </div>
    </div>
  );
}
