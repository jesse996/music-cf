import type { ActionFunction, LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { IconHome } from "@tabler/icons";
import { useEffect, useRef, useState } from "react";
import { bootstrap_track, qq_get_playlist } from "~/api/qq";
import AudioPlayer from "~/component/AudioPlayer";

export const loader: LoaderFunction = async ({
  request, context
}) => {

  const url = new URL(request.url);
  // 歌单id
  const collId = url.searchParams.get("collId")!;
  // 平台 :qq，网易云
  const pfmId = url.searchParams.get("pfmId");
  const songId = url.searchParams.get("songId") || '';

  let playlist = await qq_get_playlist(collId);
  let songDetail = await bootstrap_track(songId)

  return json({ playlist, collId, songDetail });
};

interface IInfo {
  cover_img_url: string,
  source_url: string,
  id: string,
  title: string,
}
interface ITrack {
  album: string
  album_id: string
  artist: string
  artist_id: string
  id: string
  img_url: string
  source: string
  source_url: string
  title: string
}
interface IPlayList {
  info: IInfo
  tracks: ITrack[]
}

export default function PlayList() {
  let { playlist, collId, songDetail } = useLoaderData()
  const [searchParam, setSearchParam] = useSearchParams()
  console.log('songdetail', songDetail)


  let { info, tracks } = playlist as IPlayList
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  useEffect(() => {
    let sid = searchParam.get('songId')
    if (sid) {
      let index = tracks.findIndex(item => item.id === sid)
      setCurrentSongIndex(index)
    }
  }, [currentSongIndex, searchParam, tracks])


  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (searchParam.get('songId') && !songDetail) {
      setShowToast(true)
    }
  }, [searchParam, songDetail])

  useEffect(() => {
    let timer: any
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
    }

    return () => {
      if (timer)
        clearTimeout(timer)
    }
  }, [showToast, songDetail])

  return <div className="px-4">
    <div className='mb-5 mt-2'>
      <Link prefetch="intent" to={'/'} >
        <IconHome size={40} />
      </Link>
    </div>
    <div className="card lg:card-side bg-base-100 shadow-xl">
      <figure><img src={info.cover_img_url} alt="Album" /></figure>
      <div className="card-body">
        <h2 className="card-title">{info.title}</h2>
      </div>
    </div>

    <div className="overflow-x-auto mb-28">
      <table className="table w-full">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>歌手</th>
            <th>专辑</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((i: ITrack, index: number) => (
            <tr key={i.id}>
              <th>{index + 1}</th>
              <td>
                <Link to={`/playlist?collId=${collId}&songId=${i.id}`} state={{ scroll: false }} >
                  <div>{i.title}</div>
                </Link>
              </td>
              <td>{i.artist}</td>
              <td>{i.album}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* <audio src={songDetail?.url} controls autoPlay className="fixed bottom-0 left-0 z-50 mx-auto "></audio> */}
    <AudioPlayer img={tracks[currentSongIndex].img_url} title={tracks[currentSongIndex].album} url={songDetail?.url} handleClickNext={() => {

      let index = tracks.findIndex((i: ITrack, index: number) =>
        i.id === searchParam.get('songId')
      )
      searchParam.delete('songId')
      setSearchParam({ songId: tracks[index + 1].id, collId })
    }}

      handleClickPrev={() => {
        let index = tracks.findIndex((i: ITrack, index: number) =>
          i.id === searchParam.get('songId')
        )
        searchParam.delete('songId')
        setSearchParam({ songId: tracks[index - 1].id, collId })
      }}
    />

    {(showToast && !songDetail) && <div className="toast z-50">
      <div className="alert alert-info">
        <div>
          <span>暂无版权，换源试试</span>
        </div>
      </div>
    </div>}
  </div>
}