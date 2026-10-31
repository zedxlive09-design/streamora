'use client'

import * as React from 'react'
import {
  AlertCircle,
  Maximize,
  Minimize,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface VideoPlayerProps {
  url: string
  title: string
  labels?: string[]
}

type LoadState = 'loading' | 'ready' | 'error'

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url)
}

function isSafariLike(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return (
    /safari/.test(ua) &&
    !/chrome/.test(ua) &&
    !/crios/.test(ua) &&
    !/fxios/.test(ua)
  )
}

export function VideoPlayer({ url, title, labels = [] }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const hlsRef = React.useRef<unknown>(null)
  const [state, setState] = React.useState<LoadState>('loading')
  const [errorMsg, setErrorMsg] = React.useState<string>('')
  const [muted, setMuted] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [retryToken, setRetryToken] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const hls = isHlsUrl(url)

  React.useEffect(() => {
    let disposed = false
    setState('loading')
    setErrorMsg('')

    async function setup() {
      const video = videoRef.current
      if (!video) return

      // Teardown any previous Hls instance.
      teardownHls()

      if (!hls || isSafariLike()) {
        // Native playback (Safari/iOS handles HLS; non-HLS always uses this).
        video.src = url
        try {
          await video.play().catch(() => {
            /* autoplay may be blocked — user can press play */
          })
        } catch {
          /* ignore */
        }
        if (!disposed) setState('ready')
        return
      }

      try {
        const mod = await import('hls.js')
        const Hls = mod.default
        if (disposed) return

        if (Hls.isSupported()) {
          const instance = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
          })
          hlsRef.current = instance
          instance.on(Hls.Events.MANIFEST_PARSED, () => {
            if (disposed) return
            setState('ready')
            video.play().catch(() => {
              /* user gesture required */
            })
          })
          instance.on(Hls.Events.ERROR, (_evt, data) => {
            if (disposed) return
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  instance.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  instance.recoverMediaError()
                  break
                default:
                  setErrorMsg(
                    data.details
                      ? `Stream error: ${data.details}`
                      : 'Unable to load stream.',
                  )
                  setState('error')
                  instance.destroy()
                  hlsRef.current = null
                  break
              }
            }
          })
          instance.loadSource(url)
          instance.attachMedia(video)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Fallback: native HLS on Safari even if hls.js unsupported.
          video.src = url
          setState('ready')
        } else {
          setErrorMsg('This browser cannot play HLS streams.')
          setState('error')
        }
      } catch (err) {
        if (disposed) return
        console.error('[VideoPlayer] hls.js load failed', err)
        // Last-resort: try native src.
        video.src = url
        setState('ready')
      }
    }

    setup()

    return () => {
      disposed = true
      teardownHls()
    }
  }, [url, retryToken])

  function teardownHls() {
    const inst = hlsRef.current as
      | { destroy?: () => void; detachMedia?: () => void }
      | null
    if (inst) {
      try {
        inst.destroy?.()
      } catch {
        /* ignore */
      }
      hlsRef.current = null
    }
    const video = videoRef.current
    if (video) {
      try {
        video.removeAttribute('src')
        video.load()
      } catch {
        /* ignore */
      }
    }
  }

  // Wire <video> element events for non-HLS or Safari paths.
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onLoaded = () => setState('ready')
    const onError = () => {
      setErrorMsg('The stream could not be played.')
      setState('error')
    }
    const onWaiting = () => setState('loading')
    const onPlaying = () => setState('ready')
    video.addEventListener('loadeddata', onLoaded)
    video.addEventListener('error', onError)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    return () => {
      video.removeEventListener('loadeddata', onLoaded)
      video.removeEventListener('error', onError)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
    }
  }, [url])

  // Fullscreen state listener.
  React.useEffect(() => {
    const onFsChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  async function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {
      /* ignore */
    }
  }

  function retry() {
    setRetryToken((n) => n + 1)
  }

  const warningLabels = (labels ?? []).filter(Boolean)

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border bg-black"
      aria-label={`Video player: ${title}`}
    >
      {warningLabels.length > 0 && (
        <Alert variant="default" className="rounded-none border-x-0 border-t-0 bg-muted">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Stream notice</AlertTitle>
          <AlertDescription>
            {warningLabels.join(' · ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          controls
          playsInline
          muted={muted}
          className="h-full w-full bg-black"
          aria-label={title}
          poster=""
        />

        {state === 'loading' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
            <Skeleton className="h-full w-full rounded-none opacity-40" />
            <span className="sr-only">Loading stream…</span>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center text-white">
            <AlertCircle className="size-8" aria-hidden="true" />
            <p className="text-sm">
              {errorMsg || 'Unable to play this stream.'}
            </p>
            <Button onClick={retry} size="sm" variant="secondary">
              <RotateCcw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}

        {/* Custom overlay controls (mute + fullscreen only — native controls do the rest) */}
        <div className="absolute bottom-2 right-2 z-10 flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8 bg-black/60 hover:bg-black/80"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            aria-pressed={muted}
          >
            {muted ? (
              <VolumeX className="size-4" aria-hidden="true" />
            ) : (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8 bg-black/60 hover:bg-black/80"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={fullscreen}
          >
            {fullscreen ? (
              <Minimize className="size-4" aria-hidden="true" />
            ) : (
              <Maximize className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
