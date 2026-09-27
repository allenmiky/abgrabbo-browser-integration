import {DownloadableMedia} from "~/media/MediaOnTab"
import browser from "webextension-polyfill"

let popupEl: HTMLDivElement | null = null
let dismissed = false
let listVisible = false // start collapsed
let onItemClick: ((item: DownloadableMedia) => void) | undefined

/**
 * Create the main popup element
 */
function createPopup() {
    if (popupEl) return popupEl
    const downloadMediaTitle = browser.i18n.getMessage("download_media_title")
    const iconUrl = typeof browser !== "undefined" && browser?.runtime?.getURL 
        ? browser.runtime.getURL("icons/icon-48.png") 
        : ""
    const wrapper = document.createElement("div")
    wrapper.className = "abdm-extension"
    wrapper.style.position = "fixed"
    wrapper.style.top = "8px"
    wrapper.style.left = "8px"
    wrapper.style.zIndex = "999999"
    wrapper.style.display = "flex"
    wrapper.style.flexDirection = "column"
    wrapper.style.alignItems = "start"
    wrapper.style.gap = "4px"
    wrapper.style.direction = "ltr"

    // Create style element using textContent to avoid CSP violation
    const styleEl = document.createElement("style")
    styleEl.textContent = `
      .abdm-extension * {
        font-family: "JetBrains Mono", "Fira Code", ui-monospace, sans-serif !important;
        box-sizing: border-box;
      }
      .abdm-media-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-radius: 6px;
        padding: 6px 12px;
        background: #262626;
        border: 1px solid #000;
        outline: 1px solid #404040;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        cursor: pointer;
        color: #e6e6e6;
        font-size: 12px;
        font-weight: 500;
        user-select: none;
        transition: all 0.15s ease;
      }
      .abdm-media-header:hover {
        background: #353535;
      }
      .abdm-media-header .appIcon,
      .abdm-media-header .title-wrapper,
      .abdm-media-header .abdm-media-close-btn {
        display: flex;
        align-items: center;
      }
      .abdm-media-header .appIcon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      .abdm-media-header .appIcon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .abdm-media-header .title-wrapper {
        gap: 6px;
        user-select: none;
      }
      .abdm-media-header .count-text {
        color: #2f7bf2;
        font-weight: bold;
      }
      .abdm-media-header .abdm-media-close-btn {
        cursor: pointer;
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: #93939a;
        transition: color 0.15s ease;
      }
      .abdm-media-header .abdm-media-close-btn:hover {
        color: #e5484d;
      }
      .abdm-media-list {
        background: #262626;
        border: 1px solid #000;
        outline: 1px solid #404040;
        border-radius: 6px;
        overflow: auto;
        color: #e6e6e6;
        font-size: 11px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        margin-top: 4px;
        display: none;
        max-height: 50vh;
      }
      .abdm-media-item {
        padding: 8px 12px;
        border-bottom: 1px solid #404040;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: start;
        min-width: 180px;
        transition: background 0.15s ease;
      }
      .abdm-media-item:last-child {
        border-bottom: none;
      }
      .abdm-media-item:hover {
        background: #353535;
      }
      .abdm-item-title {
        font-weight: 500;
        color: #e6e6e6;
      }
      .abdm-item-details {
        font-size: 10px;
        color: #93939a;
      }
    `
    wrapper.appendChild(styleEl)

    // Create HTML content without inline style
    const contentHTML = `
    <div class="abdm-media-header">
      <div class="appIcon">
        <img src="${iconUrl}" alt="App Icon"/>
      </div>
      <div class="title-wrapper">
        <span>${downloadMediaTitle}</span>
        (<span class="count-text">0</span>)
      </div>
      <div class="abdm-media-close-btn" title="Close">
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
    <div class="abdm-media-list"></div>
    `
    
    const contentContainer = document.createElement("div")
    contentContainer.innerHTML = contentHTML
    while (contentContainer.firstChild) {
        wrapper.appendChild(contentContainer.firstChild)
    }

    const header = wrapper.querySelector<HTMLDivElement>(".abdm-media-header")!
    const listContainer = wrapper.querySelector<HTMLDivElement>(".abdm-media-list")!

    header.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).classList.contains("abdm-media-close-btn")) return
        listVisible = !listVisible
        listContainer.style.display = listVisible ? "block" : "none"
    })

    wrapper.querySelector<HTMLSpanElement>(".abdm-media-close-btn")!.onclick = () => {
        dismissed = true
        wrapper.remove()
        popupEl = null
    }

    document.body.appendChild(wrapper)
    popupEl = wrapper
    return wrapper
}

function getBiggestMediaPlayer() {
    return Array.from(document.querySelectorAll<HTMLMediaElement>("video, audio"))
        .filter(el => el instanceof HTMLVideoElement || el instanceof HTMLAudioElement)
        .sort((a, b) => {
            const areaA = a.clientWidth * a.clientHeight
            const areaB = b.clientWidth * b.clientHeight
            return areaB - areaA
        })[0] || null
}

/**
 * Set the click listener for media items
 */
export function setItemClickListener(callback: (item: DownloadableMedia) => void) {
    onItemClick = callback
}

/**
 * Update the popup with a list of media items
 */
export function updatePopup(items: DownloadableMedia[]) {
    if (dismissed) return

    if (!items || items.length === 0) {
        popupEl?.remove()
        popupEl = null
        return
    }

    const popup = createPopup()

    const countEl = popup.querySelector<HTMLSpanElement>(".count-text")!
    countEl.textContent = String(items.length)

    const listContainer = popup.querySelector<HTMLDivElement>(".abdm-media-list")!
    listContainer.innerHTML = ""

    for (const item of items) {
        const el = document.createElement("div")
        el.className = "abdm-media-item"

        const title = item.displayName ?? "Unnamed media"
        const details = [
            item.duration,
            item.size,
            item.resolution,
            item.bandwidth,
            item.extension,
        ].filter(Boolean).join(" · ")

        el.innerHTML = `
          <div class="abdm-item-title">${title}</div>
          <div class="abdm-item-details">${details}</div>
        `

        el.onclick = () => {
            onItemClick?.(item)
        }

        listContainer.appendChild(el)
    }

    // Position near video/audio or fallback top-left
    const media = getBiggestMediaPlayer()
    if (media) {
        const rect = media.getBoundingClientRect()
        popup.style.position = "absolute" // near media
        popup.style.top = `${Math.max(rect.top - popup.offsetHeight - 2 + window.scrollY, 2)}px`
        popup.style.left = `${rect.left + window.scrollX}px`
    } else {
        popup.style.position = "fixed"
        popup.style.top = "8px"
        popup.style.left = "8px"
    }
}

/**
 * Toggle the visibility of the list manually
 */
export function toggleList(
    visible?: boolean,
) {
    if (!popupEl) return
    const listContainer = popupEl.querySelector<HTMLDivElement>(".abdm-media-list");
    if (!listContainer) return
    switch (visible) {
        case undefined:
            listVisible = !listVisible
            break
        default:
            listVisible = visible
    }
    listContainer.style.display = listVisible ? "block" : "none"
}
