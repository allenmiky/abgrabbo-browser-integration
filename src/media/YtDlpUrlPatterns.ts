type YtDlpPagePattern = {
    name: string
    test: RegExp
}

const patterns: YtDlpPagePattern[] = [
    {
        name: "youtube",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:[^#]*&)?v=[\w-]{6,}|embed\/[\w-]{6,}|shorts\/[\w-]{6,}|live\/[\w-]{6,}|v\/[\w-]{6,})/i,
    },
    {
        name: "youtu.be",
        test: /^(?:https?:)?\/\/youtu\.be\/[\w-]{6,}/i,
    },
    {
        name: "vimeo",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*vimeo\.com\/(?:\d+|video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|ondemand\/)/i,
    },
    {
        name: "twitch",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*(?:twitch\.tv\/videos\/|clips\.twitch\.tv\/|www\.twitch\.tv\/[\w-]+\/clip\/)/i,
    },
    {
        name: "x",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*(?:twitter\.com|x\.com)\/[\w-]+\/status\/\d+/i,
    },
    {
        name: "instagram",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/[\w-]+/i,
    },
    {
        name: "tiktok",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*(?:tiktok\.com\/@[\w.-]+\/video\/|vm\.tiktok\.com\/)/i,
    },
    {
        name: "facebook",
        test: /^(?:https?:)?\/\/(?:(?:[\w-]+\.)*facebook\.com\/(?:watch\/?\?|\w+\/videos\/|reel\/|share\/r\/|\w+\/posts\/)|fb\.watch\/[\w-]+)/i,
    },
    {
        name: "reddit",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*reddit\.com\/(?:r\/[\w-]+\/comments\/|user\/[\w-]+\/comments\/|[\w-]+\/comments\/)/i,
    },
    {
        name: "reddit-video",
        test: /^(?:https?:)?\/\/v\.redd\.it\//i,
    },
    {
        name: "soundcloud",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*soundcloud\.com\/[\w-]+\/[\w-]+/i,
    },
    {
        name: "dailymotion",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*dailymotion\.com\/(?:video|embed\/video)\//i,
    },
    {
        name: "bilibili",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*(?:bilibili\.com\/video\/|b23\.tv\/)/i,
    },
    {
        name: "nicovideo",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*(?:nicovideo\.jp\/watch\/|nico\.ms\/)/i,
    },
    {
        name: "rumble",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*rumble\.com\/v[\w-]+/i,
    },
    {
        name: "odysee",
        test: /^(?:https?:)?\/\/(?:[\w-]+\.)*odysee\.com\/@[\w.:-]+\/[\w-]+/i,
    },
]

function parseUrl(raw: string): URL | null {
    try {
        return new URL(raw)
    } catch (e) {
        return null
    }
}

function normalize(raw: string): string {
    return raw.trim()
}

export function detectYtDlpPage(
    rawUrl: string | null | undefined
): { site: string; url: string } | null {
    if (!rawUrl) {
        return null
    }
    const normalized = normalize(rawUrl)
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
        return null
    }
    const parsed = parseUrl(normalized)
    if (!parsed) {
        return null
    }
    for (const pattern of patterns) {
        if (pattern.test.test(normalized)) {
            return { site: pattern.name, url: parsed.toString() }
        }
    }
    return null
}

export function isLikelyMediaExtension(rawUrl: string): boolean {
    return /\.(mp4|m4v|mkv|webm|avi|mov|flv|wmv|m4a|mp3|flac|wav|opus|ogg|aac|ts|m4s|mpd|m3u8)$/i.test(
        rawUrl
    )
}
