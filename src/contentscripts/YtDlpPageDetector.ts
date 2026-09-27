import {detectYtDlpPage} from "~/media/YtDlpUrlPatterns"

export type YtDlpPageEntry = {
    site: string
    url: string
    title: string
}

const POLL_INTERVAL_MS = 400

function readTitle(): string {
    const raw = document.title?.trim()
    if (raw) {
        return raw
    }
    const h1 = document.querySelector<HTMLElement>("h1, h1.ytd-watch-metadata, .ytd-video-primary-info-renderer")
    return h1?.textContent?.trim() ?? ""
}

function readPageEntry(): YtDlpPageEntry | null {
    const detected = detectYtDlpPage(location.href)
    if (!detected) {
        return null
    }
    return {
        site: detected.site,
        url: detected.url,
        title: readTitle(),
    }
}

function sameEntry(a: YtDlpPageEntry | null, b: YtDlpPageEntry | null): boolean {
    if (!a || !b) {
        return a === b
    }
    return a.url === b.url && a.title === b.title && a.site === b.site
}

export function bootYtDlpPageDetection(
    onChange: (entry: YtDlpPageEntry | null) => void
): () => void {
    let current: YtDlpPageEntry | null = null
    let disposed = false

    const evaluate = () => {
        if (disposed) {
            return
        }
        const next = readPageEntry()
        if (sameEntry(current, next)) {
            return
        }
        current = next
        onChange(next)
    }

    evaluate()

    const interval = setInterval(evaluate, POLL_INTERVAL_MS)

    const titleObserver = new MutationObserver(() => evaluate())
    const titleEl = document.querySelector("title") ?? document.head
    if (titleEl) {
        titleObserver.observe(titleEl, {childList: true, characterData: true, subtree: true})
    }

    const onWindowChange = () => evaluate()
    window.addEventListener("popstate", onWindowChange)
    window.addEventListener("hashchange", onWindowChange)

    return () => {
        disposed = true
        clearInterval(interval)
        titleObserver.disconnect()
        window.removeEventListener("popstate", onWindowChange)
        window.removeEventListener("hashchange", onWindowChange)
    }
}
