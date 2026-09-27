import {getLinksFromSelection} from "~/utils/LinkExtractor";
import * as selectionPopup from "~/popup/selection/SelectionPopup";
import * as MediaPopup from "~/popup/media/MediaSelectionPopup";
import {debounce} from "~/utils/Debaunce";
import * as mousePosition from "~/utils/MouseUtil"
import * as HoldingKeyTracker from "~/utils/HoldingKeyTracker"
import * as Configs from "~/configs/Config"
import {run} from "~/utils/ScopeFunctions";
import {onMessage} from "webext-bridge/content-script"
import browser from "webextension-polyfill";
import {createAlertStringForMyExtension} from "~/utils/AlertMessageCreator";
import {addDownloads, addYtDlpPageDownload} from "~/contentscripts/AddDownloads";
import {sendMessage} from "webext-bridge/options";
import {DefinedCommands} from "~/message/Commands";
import {defineExtensionEntry} from "~/utils/DefineExtensionEntry";
import ContentScriptEntryType from "~/utils/EntryPointTypes/ContentScript/ContentScriptEntryType";
import type {DownloadableMedia} from "~/media/MediaOnTab";
import {bootYtDlpPageDetection, YtDlpPageEntry} from "~/contentscripts/YtDlpPageDetector";

const showPopupDelayed = debounce(500)

async function checkAndReportLinks() {
    const selection = window.getSelection();
    if (selection == null) {
        alert(createAlertStringForMyExtension(browser.i18n.getMessage("popup_alert_nothing_selected")))
        return
    }
    let downloadItems = getLinksFromSelection(selection)
    if (downloadItems.length == 0) {
        alert(createAlertStringForMyExtension(browser.i18n.getMessage("popup_alert_no_link_detected")))
        return
    }
    await addDownloads(downloadItems)
}

let lastSelectionConsumed = true

function shouldCreatePopup() {
    return lastSelectionConsumed && Configs.getLatestConfig().popupEnabled
}

export default defineExtensionEntry()
    .withType(ContentScriptEntryType)
    .withInit(async () => {
        try {
            mousePosition.boot()
            HoldingKeyTracker.boot()
            selectionPopup.setOnPopupClicked(async () => {
                checkAndReportLinks()
            })
            const ytdlpPageUris = new Set<string>()
            let sniffedMedia: DownloadableMedia[] = []
            let ytdlpPageMedia: DownloadableMedia | null = null

            const renderMediaPopup = () => {
                const merged = [...sniffedMedia]
                if (ytdlpPageMedia && !merged.some(i => i.uri === ytdlpPageMedia!.uri)) {
                    merged.unshift(ytdlpPageMedia)
                }
                MediaPopup.updatePopup(merged)
            }

            const applyYtDlpPageEntry = (entry: YtDlpPageEntry | null) => {
                ytdlpPageUris.clear()
                if (!entry) {
                    ytdlpPageMedia = null
                    renderMediaPopup()
                    return
                }
                const title = entry.title || entry.url
                ytdlpPageUris.add(entry.url)
                ytdlpPageMedia = {
                    type: "http",
                    uri: entry.url,
                    displayName: title,
                    suggestedFullName: title,
                    requestHeaders: undefined,
                    extension: "yt-dlp",
                }
                renderMediaPopup()
            }

            MediaPopup.setItemClickListener((media) => {
                if (ytdlpPageUris.has(media.uri)) {
                    addYtDlpPageDownload(media.uri, media.displayName ?? null, location.href)
                    MediaPopup.toggleList(false)
                    return
                }
                const addDownloadType = media.type
                addDownloads([
                    {
                        link: media.uri,
                        suggestedName: media.suggestedFullName ?? "",
                        type: addDownloadType,
                        downloadPage: location.href,
                        headers: media.requestHeaders ?? null,
                        description: null
                    }
                ])
                MediaPopup.toggleList(false)
            })

            if (Configs.getLatestConfig().popupEnabled) {
                bootYtDlpPageDetection(applyYtDlpPageEntry)
            }

            document.addEventListener("selectionchange", () => {
                lastSelectionConsumed = true
                const selection = window.getSelection();
                if (!selection || selection.type !== "Range") {
                    selectionPopup.closeAddDownloadPopupUi();
                }
            })

            document.addEventListener("mousedown", () => {
                showPopupDelayed.cancel()
            })

            document.addEventListener("mouseup", () => {
                showPopupDelayed(() => {
                    const mousePositionInPage = mousePosition.getMousePositionInPage();
                    if (!shouldCreatePopup() || mousePositionInPage === null) {
                        return;
                    }
                    const selection = window.getSelection();
                    if (selection == null) {
                        return;
                    }
                    if (selection.type !== "Range") {
                        return;
                    }
                    const linksFromSelection = getLinksFromSelection(selection);
                    if (linksFromSelection.length == 0) {
                        return
                    }
                    lastSelectionConsumed = false
                    selectionPopup.showAddDownloadPopupUi(mousePositionInPage)
                })
                run(async () => {
                    try {
                        await sendMessage(
                            DefinedCommands.SET_HOLDING_KEY,
                            HoldingKeyTracker.getHoldingKey(),
                            "background"
                        )
                    } catch (e) {
                        // ignored
                    } finally {
                        HoldingKeyTracker.clear()
                    }
                })
            })

            onMessage(DefinedCommands.SHOW_LOG, (msg) => {
                console.log(...msg.data)
            })
            onMessage(DefinedCommands.SHOW_ALERT, (msg) => {
                alert(createAlertStringForMyExtension(msg.data))
            })
            onMessage(DefinedCommands.CHECK_SELECTED_TEXT_FOR_LINKS, (msg) => {
                checkAndReportLinks()
            })
            onMessage(DefinedCommands.DOWNLOADABLE_MEDIA_DETECTED, (msg) => {
                sniffedMedia = msg.data
                renderMediaPopup()
            })
        } catch (e) {
            console.log("failed to load ab-dm-extension", e)
            throw e
        }
    })



