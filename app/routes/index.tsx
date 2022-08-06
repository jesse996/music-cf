import type { LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { ICollection, IPlaylistFilters } from "~/api/qq";
import { show_playlist } from "~/api/qq";
import { IAll, IRecommend, qq_get_playlist } from "~/api/qq";
import { get_playlist_filters } from "~/api/qq";


interface IProps {
  playlistFilters: IPlaylistFilters,
  collection: ICollection[]
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);

  const offset = Number(url.searchParams.get("offset")) || 0;
  const filterId = url.searchParams.get("filterId") || '';

  const playlistFilters = await get_playlist_filters()
  //歌单
  let collection = (await show_playlist(offset, filterId)) || []

  return json<IProps>({ playlistFilters, collection })
}

export default function Index() {
  const { playlistFilters, collection } = useLoaderData<IProps>();
  let { recommend, all } = playlistFilters;
  const [allColl, setAllColl] = useState<Set<ICollection>>(new Set())
  const param = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  //展示全部分类
  const [showAllFilter, setShowAllFilter] = useState(false)
  useEffect(() => {
    console.log('searchParams.get()', searchParams.get('offsetId'))
    if (searchParams.get('offset')) {
      setAllColl(new Set([...allColl, ...collection]))
    } else {
      setAllColl(new Set(collection))
    }
  }, [collection])

  //加载更多
  useEffect(() => {
    let listener = async () => {
      // 网页滚动高度
      var scrollTopHeight = document.body.scrollTop || document.documentElement.scrollTop
      // 文档显示区域的高度
      var showHeight = window.innerHeight
      // 所有内容的高度
      var allHeight = document.body.scrollHeight
      // 只需要判断内容盒子的高度+滚动条的scrollTop = 盒子内容的高度即为触底
      if (allHeight - 66 < scrollTopHeight + showHeight) {
        console.log("触底了:",)
        // this.getData()
        // createSearchParams

        searchParams.delete('offset')
        let param = new URLSearchParams([
          ['offset', (allColl.size + 1).toString()],
          ...searchParams
        ]);

        setSearchParams(param, { state: { scroll: false } })
        // navigate(`./?offset=${allColl.size + 1}`, { state: { scroll: false } })
      }
    }
    window.addEventListener('scroll', listener)
    return () => {
      window.removeEventListener('scroll', listener)
    }
  }, [allColl.size, searchParams, setSearchParams])

  const [articles, setArticles] = useState<any>()
  useEffect(() => {
    (async () => {
      let res = await fetch('https://fml233.cn/Articles')
      let data = await res.json()
      console.log(data)
      setArticles(data)
    })()
  }, [])

  return (
    <div className="w-4/5 mx-auto mt-10">
      <div>articles:</div>
      {JSON.stringify(articles)}
      <div className="flex space-x-2">
        {recommend.map(({ id, name }) => (
          <button key={id} className='btn' onClick={() => {
            // searchParams.delete('filterId')
            // let params = new URLSearchParams([['filterId', id], ...searchParams])
            // setSearchParams(params)

            navigate('/?filterId=' + id)

          }}>{name} </button>
        ))}

        <button className="btn btn-outline" onClick={() => {
          setShowAllFilter(!showAllFilter)
        }}>全部...</button>
      </div>
      {showAllFilter && <div className="mt-4 ">
        {all.map(({ category, filters }) => (
          <div key={category} className='flex flex-wrap space-x-2 place-items-center space-y-2'>
            <span className=" text-2xl mr-4">{category}</span>
            {filters.map(({ id, name }) => (
              <button key={id} className='btn' onClick={() => {
                // let params = new URLSearchParams([['filterId', id], ...searchParams])
                // setSearchParams(params)
                navigate('/?filterId=' + id)
              }}>{name}  </button>
            ))}
          </div>
        ))}
      </div>}

      <div className="mt-10 grid grid-cols-5 gap-2">
        {[...allColl]?.map(({ id, cover_img_url, title, source_url }, index) => (
          <Link key={index} to={`/playlist?collId=${id}`}>
            <div className="card bg-base-100 shadow-xl">
              <figure><img src={cover_img_url} alt={title} className='w-full object-contain aspect-square' /></figure>
              <div className="card-body h-24">
                {/* <h2 className="card-title">Shoes!</h2> */}
                <p className=" truncate">{title}</p>

              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
