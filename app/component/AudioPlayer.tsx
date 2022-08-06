import { IconPlayerPause, IconPlayerPlay, IconPlayerSkipBack, IconPlayerSkipForward, IconPlayerTrackNext, IconPlayerTrackPrev } from "@tabler/icons"
import { useEffect, useRef, useState } from "react"

interface IProps {
  img: string,
  title: string,
  url: string,
  className?: string,
  handleClickPrev: () => void,
  handleClickNext: () => void,
}

export default function AudioPlayer(props: IProps) {
  const { img, title, url, handleClickNext, handleClickPrev } = props
  const audioRef = useRef<HTMLAudioElement>(null)
  const [range, setRange] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  useEffect(() => {

    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', () => {
        setRange(audioRef.current!.currentTime)
      }
      )
    }
  }, [audioRef])

  useEffect(() => {
    if (!url) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }, [url])

  useEffect(() => {
    if (isPlaying) {
      audioRef.current!.play()
    } else {
      audioRef.current!.pause()
    }
  }, [isPlaying])

  return <div className={`w-4/5 fixed bottom-0 left-0 right-0 z-20 mx-auto bg-stone-200	 px-10 py-3 opacity-90 shadow-2xl drop-shadow`} >

    <div className="flex place-items-center space-x-2 ">

      <img src={img} alt="" className="w-20 h-20" />
      <div className="flex flex-col place-content-between space-y-2 w-full">
        <span className=" text-2xl font-bold">{title}</span>
        <div className="flex space-x-2">
          <IconPlayerSkipBack className=" cursor-pointer" onClick={handleClickPrev} />
          {isPlaying ? <IconPlayerPause onClick={() => {
            setIsPlaying(v => !v)

          }} className=" cursor-pointer" /> : <IconPlayerPlay onClick={() => {
            setIsPlaying(v => !v)
          }} className=" cursor-pointer" />}
          <IconPlayerSkipForward className=" cursor-pointer" onClick={handleClickNext} />
        </div>
        <input type="range" min="0" max={audioRef.current?.duration || 0} value={range} className="range range-xs" onChange={e => {
          setRange(parseFloat(e.target.value))
          audioRef.current!.currentTime = Number(e.target.value)
        }} />
      </div>
    </div>

    <audio hidden src={url} ref={audioRef} autoPlay />
  </div>
}