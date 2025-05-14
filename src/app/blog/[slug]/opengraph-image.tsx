import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/posts'

// Image metadata
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)


  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'radial-gradient(at 20% 0%, #942DE7 0px, transparent 30%), radial-gradient(at 0% 25%, rgba(148, 45, 231, 0.6) 0px, transparent 30%), radial-gradient(at 80% 50%, #630f9e 0px, transparent 50%), radial-gradient(at 0% 100%, #202020 0px, transparent 50%), radial-gradient(at 80% 100%, #120520 0px, transparent 50%), radial-gradient(at 0% 0%, #4a176e 0px, transparent 50%)',
        backgroundColor: '#0c0c0c', // Fallback background color
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '40px',
        position: 'relative',
      }}
    >
      {/* Light blur overlay for better text readability */}
      <div style={{
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, transparent 10%, rgba(0,0,0,0.4) 100%)',
        zIndex: 1,
      }} />

      {/* Content container with proper z-index */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        zIndex: 2,
        position: 'relative',
      }}>
        {/* SVG logo with subtle glow effect */}
        <div style={{
          transform: 'scale(0.85)',
          marginBottom: '15px',
          display: 'flex',
        }}>
          <svg width={378} height={286} viewBox="0 0 378 286" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M283.198 143.037H236.099V190.438H283.198V143.037Z"
              fill="#942DE7"
              opacity="0.9"
            />
            <path
              d="M189.074 143.037H141.975V190.438H189.074V143.037Z"
              fill="#942DE7"
              opacity="0.9"
            />
            <path
              d="M330.223 48.3099L283.124 0.90918H236.099H189H141.975H94.8759V48.3099H47.8507V95.6364H0.75177V143.037V190.364L47.8507 237.764L94.8759 285.091H141.975H189H236.099H283.124H330.223V237.764H283.124H236.099H189H141.975H94.8759V190.364V143.037V95.6364H141.975H189H236.099H283.124H330.223V143.037V190.364V237.764H377.248V190.364V143.037V95.6364L330.223 48.3099Z"
              fill="#942DE7"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* Content Container with modern styling */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '80%',
          textAlign: 'center',
        }}>
          {/* Title with text shadow for better readability */}
          <div style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 16,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            letterSpacing: '-0.02em',
          }}>
            {post.title}
          </div>

          {/* Decorative separator line */}
          <div style={{
            width: '800px',
            height: '4px',
            display: 'flex',
            background: 'linear-gradient(90deg, transparent, #942DE7, transparent)',
            margin: '16px 0',
            borderRadius: '2px',
          }} />

          {/* Author with stylish presentation */}
          <div style={{
            fontSize: 24,
            fontWeight: 500,
            display: 'flex',
            opacity: 0.9,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            By {post.author}
          </div>

        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}