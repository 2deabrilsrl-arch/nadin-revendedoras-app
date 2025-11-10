'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, Instagram, Facebook, Globe, Linkedin, 
  Twitter, Youtube, MessageCircle, Phone, Mail,
  Star, Award, TrendingUp, ArrowLeft
} from 'lucide-react';

interface PublicProfile {
  name: string;
  handle: string;
  telefono: string;
  profilePhoto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsappBusiness?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
  stats?: {
    level: string;
    totalSales: number;
    badgesCount: number;
  };
}

const LEVEL_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  principiante: { name: 'Principiante', icon: '🌱', color: 'text-gray-600' },
  bronce: { name: 'Bronce', icon: '🥉', color: 'text-orange-600' },
  plata: { name: 'Plata', icon: '🥈', color: 'text-gray-500' },
  oro: { name: 'Oro', icon: '🥇', color: 'text-yellow-600' },
  diamante: { name: 'Diamante', icon: '💎', color: 'text-blue-600' },
  leyenda: { name: 'Leyenda', icon: '👑', color: 'text-purple-600' }
};

export default function PerfilPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params?.handle as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!handle) return;
    loadPublicProfile();
  }, [handle]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/public/${handle}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Perfil no encontrado');
        } else {
          setError('Error al cargar el perfil');
        }
        return;
      }

      const data = await response.json() as any;
      setProfile(data);

    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getSocialLink = (type: string, username?: string) => {
    if (!username) return null;

    switch (type) {
      case 'instagram':
        return `https://instagram.com/${username.replace('@', '')}`;
      case 'facebook':
        return username.startsWith('http') ? username : `https://facebook.com/${username}`;
      case 'tiktok':
        return `https://tiktok.com/@${username.replace('@', '')}`;
      case 'linkedin':
        return username.startsWith('http') ? username : `https://linkedin.com/in/${username}`;
      case 'twitter':
        return `https://twitter.com/${username.replace('@', '')}`;
      case 'youtube':
        return username.startsWith('http') ? username : `https://youtube.com/@${username}`;
      default:
        return username;
    }
  };

  const formatPhone = (phone: string) => {
    // Convertir a formato internacional para WhatsApp
    return phone.replace(/[^\d]/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Perfil no encontrado'}
          </h2>
          <p className="text-gray-600 mb-6">
            El perfil que estás buscando no existe o no está disponible.
          </p>
          <a
            href="/"
            className="inline-block bg-nadin-pink text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  const levelConfig = profile.stats?.level ? LEVEL_CONFIG[profile.stats.level] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Botón de volver - Fixed en la esquina superior izquierda */}
      <button
        onClick={() => {
          const win = (globalThis as any).window;
          // Si se abrió en nueva pestaña, cerrar
          if (win?.opener) {
            win.close();
          } else if (win?.history?.length > 1) {
            // Si hay historial, volver
            router.back();
          } else {
            // Si no, ir al inicio
            router.push('/dashboard');
          }
        }}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Volver</span>
      </button>

      {/* Header con foto y nombre */}
      <div className="bg-gradient-to-r from-nadin-pink to-pink-400 text-white pt-20 pb-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-6">
            <div className="inline-block relative">
              <div className="w-32 h-32 rounded-full bg-white overflow-hidden border-4 border-white shadow-xl">
                {profile.profilePhoto ? (
                  <img 
                    src={profile.profilePhoto} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-pink-100">
                    <User size={48} className="text-nadin-pink" />
                  </div>
                )}
              </div>
              {levelConfig && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                  <span className="text-3xl">{levelConfig.icon}</span>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-pink-100 text-lg mb-4">@{profile.handle}</p>
          
          {levelConfig && (
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Award size={16} />
              <span className="font-semibold">{levelConfig.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 pb-12">
        {/* Stats Cards */}
        {profile.stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-3xl font-bold text-nadin-pink mb-1">
                {profile.stats.totalSales}
              </div>
              <div className="text-sm text-gray-600">Ventas</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {profile.stats.badgesCount}
              </div>
              <div className="text-sm text-gray-600">Badges</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-3xl mb-1">{levelConfig?.icon}</div>
              <div className="text-sm text-gray-600">Nivel</div>
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Star size={20} className="text-nadin-pink" />
              Sobre Mí
            </h3>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Contacto */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Phone size={20} className="text-nadin-pink" />
            Contacto
          </h3>
          
          <div className="space-y-3">
            {profile.whatsappBusiness && (
              <a
                href={`https://wa.me/${formatPhone(profile.whatsappBusiness)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <MessageCircle size={20} className="text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">WhatsApp Business</div>
                  <div className="text-sm text-gray-600">{profile.whatsappBusiness}</div>
                </div>
              </a>
            )}

            {profile.telefono && (
              <a
                href={`tel:${profile.telefono}`}
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Phone size={20} className="text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Teléfono</div>
                  <div className="text-sm text-gray-600">{profile.telefono}</div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Redes Sociales */}
        {(profile.instagram || profile.facebook || profile.tiktok || profile.linkedin || 
          profile.twitter || profile.youtube || profile.website) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Globe size={20} className="text-nadin-pink" />
              Redes Sociales
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.instagram && (
                <a
                  href={getSocialLink('instagram', profile.instagram) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Instagram size={20} />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
              )}

              {profile.facebook && (
                <a
                  href={getSocialLink('facebook', profile.facebook) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Facebook size={20} />
                  <span className="text-sm font-medium">Facebook</span>
                </a>
              )}

              {profile.tiktok && (
                <a
                  href={getSocialLink('tiktok', profile.tiktok) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-900 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  <span className="text-sm font-medium">TikTok</span>
                </a>
              )}

              {profile.linkedin && (
                <a
                  href={getSocialLink('linkedin', profile.linkedin) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-blue-700 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Linkedin size={20} />
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
              )}

              {profile.twitter && (
                <a
                  href={getSocialLink('twitter', profile.twitter) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-sky-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Twitter size={20} />
                  <span className="text-sm font-medium">Twitter</span>
                </a>
              )}

              {profile.youtube && (
                <a
                  href={getSocialLink('youtube', profile.youtube) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-red-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Youtube size={20} />
                  <span className="text-sm font-medium">YouTube</span>
                </a>
              )}

              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Globe size={20} />
                  <span className="text-sm font-medium">Sitio Web</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t py-6 text-center text-sm text-gray-600">
        <p>Perfil de Revendedora Nadin Lencería</p>
      </div>
    </div>
  );
}
