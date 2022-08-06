export interface IRecommend {
    id: string
    name: string
}
export interface IAll {
    category: string
    filters: IRecommend[]
}
export interface IPlaylistFilters {
    recommend: Array<IRecommend>
    all: Array<IAll>
}

export interface ICollection {
    cover_img_url: string
    title: string
    id: string
    source_url: string
}

export async function get_playlist_filters(): Promise<IPlaylistFilters> {
    const target_url =
        'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg' +
        `?picmid=1&rnd=${Math.random()}&g_tk=732560869` +
        '&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8' +
        '&notice=0&platform=yqq.json&needNewCode=0'

    let res = await fetch(target_url, {
        headers: {
            Referer: 'https://y.qq.com/',
        },
    })
    let json: any = await res.json()
    const all = [] as IAll[]
    json.data.categories.forEach((cate: any) => {
        const result = {
            category: cate.categoryGroupName,
            filters: [] as IRecommend[],
        }
        if (cate.usable === 1) {
            cate.items.forEach((item: any) => {
                result.filters.push({
                    id: item.categoryId,
                    name: item.categoryName,
                })
            })
            all.push(result)
        }
    })
    const recommendLimit = 8
    const recommend = [
        { id: '', name: '全部' },
        { id: 'toplist', name: '排行榜' },
        ...all[1].filters.slice(0, recommendLimit),
    ] as IRecommend[]

    return {
        recommend,
        all,
    }
}

export async function qq_get_playlist(playlistId: string) {
    const list_id = playlistId.split('_').pop()

    const target_url = `https://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&nosign=1&disstid=${list_id}&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`

    let res = await fetch(target_url, {
        headers: {
            Referer: 'https://y.qq.com/',
        },
    })
    let data: any = await res.json()

    const info = {
        cover_img_url: data.cdlist[0].logo,
        title: data.cdlist[0].dissname,
        id: `qqplaylist_${list_id}`,
        source_url: `https://y.qq.com/n/ryqq/playlist/${list_id}`,
    }

    const tracks = data.cdlist[0].songlist.map((item: any) =>
        qq_convert_song(item)
    )
    return {
        tracks,
        info,
    }
}

function getParameterByName(name: string, url: string) {
    if (!url) url = window.location.href
    name = name.replace(/[\[\]]/g, '\\$&') // eslint-disable-line no-useless-escape
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`)

    const results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    let res = decodeURIComponent(results[2].replace(/\+/g, ' '))

    return res
}

function qq_convert_song(song: any) {
    const d = {
        id: `qqtrack_${song.songmid}`,
        title: song.songname,
        artist: song.singer[0].name,
        artist_id: `qqartist_${song.singer[0].mid}`,
        album: song.albumname,
        album_id: `qqalbum_${song.albummid}`,
        img_url: qq_get_image_url(song.albummid, 'album'),
        source: 'qq',
        source_url: `https://y.qq.com/#type=song&mid=${song.songmid}&tpl=yqq_song_detail`,
        // url: `qqtrack_${song.songmid}`,
        url: !qq_is_playable(song) ? '' : undefined,
    }
    return d
}

function qq_get_image_url(qqimgid: string, img_type: string) {
    if (qqimgid == null) {
        return ''
    }
    let category = ''
    if (img_type === 'artist') {
        category = 'T001R300x300M000'
    }
    if (img_type === 'album') {
        category = 'T002R300x300M000'
    }
    const s = category + qqimgid
    const url = `https://y.gtimg.cn/music/photo_new/${s}.jpg`
    return url
}

function qq_is_playable(song: any) {
    const switch_flag = song.switch.toString(2).split('')
    switch_flag.pop()
    switch_flag.reverse()
    // flag switch table meaning:
    // ["play_lq", "play_hq", "play_sq", "down_lq", "down_hq", "down_sq", "soso",
    //  "fav", "share", "bgm", "ring", "sing", "radio", "try", "give"]
    const play_flag = switch_flag[0]
    const try_flag = switch_flag[13]
    return play_flag === '1' || (play_flag === '1' && try_flag === '1')
}

//歌单
export async function show_playlist(
    offset: number,
    filterId: string
): Promise<ICollection[] | undefined> {
    if (filterId === 'toplist') {
        // return this.qq_show_toplist(offset)
        return
    }
    if (filterId === '') {
        filterId = '10000000'
    }

    const target_url =
        'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg' +
        `?picmid=1&rnd=${Math.random()}&g_tk=732560869` +
        '&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8' +
        '&notice=0&platform=yqq.json&needNewCode=0' +
        `&categoryId=${filterId}&sortId=5&sin=${offset}&ein=${29 + offset}`

    let res = await fetch(target_url, {
        headers: {
            Referer: 'https://y.qq.com/',
        },
    })

    let data: any = await res.json()
    const playlists = data.data.list.map((item: any) => ({
        cover_img_url: item.imgurl,
        title: item.dissname,
        id: `qqplaylist_${item.dissid}`,
        source_url: `https://y.qq.com/n/ryqq/playlist/${item.dissid}`,
    }))

    return playlists
}

//播放音乐
export async function bootstrap_track(trackId: string) {
    const sound: any = {}
    const songId = trackId.slice('qqtrack_'.length)
    const target_url = 'https://u.y.qq.com/cgi-bin/musicu.fcg?'
    // thanks to https://github.com/Rain120/qq-music-api/blob/2b9cb811934888a532545fbd0bf4e4ab2aea5dbe/routers/context/getMusicPlay.js
    const guid = '10000'
    const songmidList = [songId]
    const uin = '0'

    const fileType = '128'
    const fileConfig = {
        m4a: {
            s: 'C400',
            e: '.m4a',
            bitrate: 'M4A',
        },
        128: {
            s: 'M500',
            e: '.mp3',
            bitrate: '128kbps',
        },
        320: {
            s: 'M800',
            e: '.mp3',
            bitrate: '320kbps',
        },
        ape: {
            s: 'A000',
            e: '.ape',
            bitrate: 'APE',
        },
        flac: {
            s: 'F000',
            e: '.flac',
            bitrate: 'FLAC',
        },
    }
    const fileInfo = fileConfig[fileType]
    const file =
        songmidList.length === 1 &&
        `${fileInfo.s}${songId}${songId}${fileInfo.e}`

    const reqData = {
        req_0: {
            module: 'vkey.GetVkeyServer',
            method: 'CgiGetVkey',
            param: {
                filename: file ? [file] : [],
                guid,
                songmid: songmidList,
                songtype: [0],
                uin,
                loginflag: 1,
                platform: '20',
            },
        },
        loginUin: uin,
        comm: {
            uin,
            format: 'json',
            ct: 24,
            cv: 0,
        },
    }
    const params = {
        format: 'json',
        data: JSON.stringify(reqData),
    }
    let res = await fetch(target_url + new URLSearchParams(params), {
        headers: {
            Referer: 'https://y.qq.com/',
            host: 'y.qq.com',
        },
    })
    let data: any = await res.json()

    const { purl } = data.req_0.data.midurlinfo[0]

    if (purl === '') {
        // vip
        console.log('need vip')
        return
    }
    const url = data.req_0.data.sip[0] + purl
    sound.url = url
    const prefix = purl.slice(0, 4)
    const found = Object.values(fileConfig).filter((i) => i.s === prefix)
    sound.bitrate = found.length > 0 ? found[0].bitrate : ''
    sound.platform = 'qq'

    return sound
}
