'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Camera, Instagram, Facebook, Globe, Linkedin, 
  Twitter, Youtube, MessageCircle, Link as LinkIcon, 
  Save, QrCode, Share2, Edit, Eye, LogOut, CreditCard
} from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';
import QRCode from 'qrcode';

interface ProfileData {
  name: string;
  email: string;
  dni: string;
  telefono: string;
  handle: string;
  margen: number;
  cbu: string;
  alias: string;
  cvu: string;
  profilePhoto: string;
  bio: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsappBusiness: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  website: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const userStr = (globalThis as any).localStorage?.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setUserId(user.id);
    loadProfile(user.id);
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile?userId=${uid}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar perfil');
      }

      const data = await response.json() as any;
      setProfile(data);
      
      if (data.profilePhoto) {
        setPhotoPreview(data.profilePhoto);
      }

      // Generar QR del perfil
      const profileUrl = `${(globalThis as any).window?.location?.origin || ''}/perfil/${data.handle}`;
      const qr = await QRCode.toDataURL(profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#E91E63',
          light: '#FFFFFF'
        }
      });
      setQrCode(qr);

    } catch (err) {
      console.error('Error:', err);
      (globalThis as any).alert?.('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as any).files?.[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      (globalThis as any).alert?.('La imagen no puede superar los 5MB');
      return;
    }

    // Preview local
    const FileReaderClass = (globalThis as any).FileReader;
    if (FileReaderClass) {
      const reader = new FileReaderClass();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      // Si hay foto nueva, subirla primero
      let photoUrl = profile.profilePhoto;
      if (photoPreview && photoPreview.startsWith('data:')) {
        const uploadResponse = await fetch('/api/profile/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId,
            photo: photoPreview 
          })
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json() as any;
          photoUrl = url;
        }
      }

      // Guardar perfil completo
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...profile,
          profilePhoto: photoUrl
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      (globalThis as any).alert?.('✅ Perfil actualizado correctamente');
      
      // Actualizar localStorage
      const updatedUser = await response.json() as any;
      (globalThis as any).localStorage?.setItem('user', JSON.stringify(updatedUser));

    } catch (err) {
      console.error('Error:', err);
      (globalThis as any).alert?.('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string | number) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const copyProfileLink = () => {
    const link = `${(globalThis as any).window?.location?.origin || ''}/perfil/${profile?.handle}`;
    const nav = (globalThis as any).navigator;
    if (nav?.clipboard) {
      nav.clipboard.writeText(link);
      (globalThis as any).alert?.('✅ Link copiado al portapapeles');
    }
  };

  const shareProfile = async () => {
    const link = `${(globalThis as any).window?.location?.origin || ''}/perfil/${profile?.handle}`;
    const nav = (globalThis as any).navigator;
    
    if (nav?.share) {
      try {
        await nav.share({
          title: `Perfil de ${profile?.name}`,
          text: `¡Mirá mi perfil de revendedora Nadin!`,
          url: link
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyProfileLink();
    }
  };

  const handleLogout = () => {
    if ((globalThis as any).window?.confirm('¿Estás segura que querés cerrar sesión?')) {
      (globalThis as any).localStorage?.removeItem('user');
      router.push('/login');
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <BackToHomeButton />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">👤 Mi Perfil</h1>
        <p className="text-gray-600">Completá tu perfil para mostrarlo a tus clientas</p>
      </div>

      {/* Foto de Perfil */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Camera size={20} className="text-nadin-pink" />
          Foto de Perfil
        </h3>
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-nadin-pink text-white p-2 rounded-full cursor-pointer hover:bg-pink-600 shadow-lg">
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Subí una foto para que tus clientas te reconozcan
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG o GIF - Máximo 5MB
            </p>
            {photoPreview && (
              <button
                onClick={() => {
                  setPhotoPreview(null);
                  handleChange('profilePhoto', '');
                }}
                className="text-sm text-red-500 hover:text-red-700 mt-2"
              >
                Eliminar foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Datos Básicos */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">📋 Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', (e.target as any).value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handle (usuario único) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">@</span>
              <input
                type="text"
                value={profile.handle}
                onChange={(e) => handleChange('handle', (e.target as any).value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                placeholder="tunombre"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tu perfil será: /perfil/@{profile.handle}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={profile.telefono}
              onChange={(e) => handleChange('telefono', (e.target as any).value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margen (%) *
            </label>
            <input
              type="number"
              value={profile.margen}
              onChange={(e) => handleChange('margen', parseFloat((e.target as any).value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
              min="0"
              max="200"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">✍️ Sobre Mí</h3>
        <textarea
          value={profile.bio || ''}
          onChange={(e) => handleChange('bio', (e.target as any).value)}
          placeholder="Contale a tus clientas quién sos, qué te inspira, por qué eligen comprarte a vos..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {profile.bio?.length || 0} / 500 caracteres
        </p>
      </div>

      {/* Redes Sociales */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Globe size={20} />
          Redes Sociales
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Agregá tus redes para que tus clientas te encuentren (todas opcionales)
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Instagram size={20} className="text-pink-500" />
            <input
              type="text"
              value={profile.instagram || ''}
              onChange={(e) => handleChange('instagram', (e.target as any).value)}
              placeholder="@tuusuario"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <Facebook size={20} className="text-blue-600" />
            <input
              type="text"
              value={profile.facebook || ''}
              onChange={(e) => handleChange('facebook', (e.target as any).value)}
              placeholder="facebook.com/tupagina"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            <input
              type="text"
              value={profile.tiktok || ''}
              onChange={(e) => handleChange('tiktok', (e.target as any).value)}
              placeholder="@tuusuario"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-green-500" />
            <input
              type="text"
              value={profile.whatsappBusiness || ''}
              onChange={(e) => handleChange('whatsappBusiness', (e.target as any).value)}
              placeholder="+54 9 11 1234-5678"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <Linkedin size={20} className="text-blue-700" />
            <input
              type="text"
              value={profile.linkedin || ''}
              onChange={(e) => handleChange('linkedin', (e.target as any).value)}
              placeholder="linkedin.com/in/tunombre"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <Twitter size={20} className="text-sky-500" />
            <input
              type="text"
              value={profile.twitter || ''}
              onChange={(e) => handleChange('twitter', (e.target as any).value)}
              placeholder="@tuusuario"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <Youtube size={20} className="text-red-600" />
            <input
              type="text"
              value={profile.youtube || ''}
              onChange={(e) => handleChange('youtube', (e.target as any).value)}
              placeholder="youtube.com/@tucanal"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <Globe size={20} className="text-gray-600" />
            <input
              type="url"
              value={profile.website || ''}
              onChange={(e) => handleChange('website', (e.target as any).value)}
              placeholder="https://tusitioweb.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Datos Bancarios */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Datos Bancarios
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CBU
            </label>
            <input
              type="text"
              value={profile.cbu || ''}
              onChange={(e) => handleChange('cbu', (e.target as any).value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
              maxLength={22}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alias
            </label>
            <input
              type="text"
              value={profile.alias || ''}
              onChange={(e) => handleChange('alias', (e.target as any).value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVU
            </label>
            <input
              type="text"
              value={profile.cvu || ''}
              onChange={(e) => handleChange('cvu', (e.target as any).value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
              maxLength={22}
            />
          </div>
        </div>
      </div>

      {/* Compartir Perfil */}
      <div className="bg-gradient-to-r from-nadin-pink to-pink-400 text-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Share2 size={22} />
          Compartí tu Perfil
        </h3>
        <p className="text-sm text-pink-100 mb-4">
          Compartí tu perfil con tus clientas para que te conozcan mejor
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={copyProfileLink}
            className="bg-white text-nadin-pink px-4 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
          >
            <LinkIcon size={18} />
            <span className="text-sm">Copiar Link</span>
          </button>

          <button
            onClick={shareProfile}
            className="bg-white text-nadin-pink px-4 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            <span className="text-sm">Compartir</span>
          </button>

          <button
            onClick={() => setShowQR(!showQR)}
            className="bg-white text-nadin-pink px-4 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode size={18} />
            <span className="text-sm">Ver QR</span>
          </button>

          <a
            href={`/perfil/${profile.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-nadin-pink px-4 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            <span className="text-sm">Ver Perfil</span>
          </a>
        </div>

        {showQR && qrCode && (
          <div className="mt-4 bg-white rounded-lg p-4 text-center">
            <img src={qrCode} alt="QR Code" className="mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Escaneá este código para ver tu perfil
            </p>
          </div>
        )}
      </div>

      {/* Botón Guardar y Cerrar Sesión */}
      <div className="sticky bottom-4 bg-white rounded-lg shadow-xl p-4 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-nadin-pink text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>

        <button
          onClick={handleLogout}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
