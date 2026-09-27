import {DownloadRequestHeaders, DownloadRequestItem} from "~/interfaces/DownloadRequestItem";
import {sendMessage} from "webext-bridge/options";
import * as Configs from "~/configs/Config"
import {DefinedCommands} from "~/message/Commands";
import browser from "webextension-polyfill";

export async function addDownloads(downloadItems: Array<DownloadRequestItem>) {
    if (Configs.getLatestConfig().sendHeaders) {
        const headersOfLinks = await sendMessage(DefinedCommands.GET_HEADERS, downloadItems.map(i => i.link))
        downloadItems = downloadItems.map((value, index) => {
            // some download items might have headers so we use them instead
            return {
                ...value,
                headers: value.headers ?? headersOfLinks[index],
            } as DownloadRequestItem
        })
    } else {
        downloadItems = downloadItems.map((value, index) => {
            return {
                ...value,
                headers: null, // remove headers if user don't want to send headers
            } as DownloadRequestItem
        })
    }
    await sendMessage(DefinedCommands.ADD_DOWNLOAD, downloadItems, "background")
}

/**
 * Collect all YouTube/Google cookies from the browser's own cookie store and
 * format them as a Netscape HTTP Cookie File string that yt-dlp understands
 * when passed via --cookies <file>.
 */
async function collectYtCookiesNetscape(pageUrl: string): Promise<string | null> {
    try {
        const domains = [".youtube.com", ".google.com", ".googlevideo.com", ".ggpht.com"]
        const allCookies = (
            await Promise.all(domains.map(d => browser.cookies.getAll({domain: d})))
        ).flat()

        if (allCookies.length === 0) return null

        const lines: string[] = ["# Netscape HTTP Cookie File"]
        for (const c of allCookies) {
            const domain = c.domain.startsWith(".") ? c.domain : "." + c.domain
            const flag = domain.startsWith(".") ? "TRUE" : "FALSE"
            const secure = c.secure ? "TRUE" : "FALSE"
            const expiry = c.expirationDate ? Math.round(c.expirationDate) : 0
            lines.push(`${domain}\t${flag}\t${c.path}\t${secure}\t${expiry}\t${c.name}\t${c.value}`)
        }
        return lines.join("\n")
    } catch (e) {
        console.log("grabbo: failed to collect yt cookies", e)
        return null
    }
}

export async function addYtDlpPageDownload(
    link: string,
    suggestedName: string | null,
    downloadPage: string,
) {
    const ytCookies = await collectYtCookiesNetscape(downloadPage)
    await sendMessage(
        DefinedCommands.ADD_DOWNLOAD,
        [
            {
                link,
                downloadPage,
                headers: null,
                description: null,
                suggestedName,
                type: "yt-dlp",
                ytCookies: ytCookies,
            } as DownloadRequestItem
        ],
        "background"
    )
}
