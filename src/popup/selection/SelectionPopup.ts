import { PositionInPage } from "~/utils/MouseUtil";
import browser from "webextension-polyfill";

const AB_DM_POPUP_CLASSNAME = "ab_dm_popup_class";
let showingPopup = false;

let onClickListener = () => {};

export function setOnPopupClicked(listener: () => void) {
    onClickListener = listener;
}
export function showAddDownloadPopupUi(position: PositionInPage) {
    if (showingPopup) {
        closeAddDownloadPopupUi();
    }
    const el = createUi(
        position,
        () => {
            try {
                onClickListener();
            } finally {
                closeAddDownloadPopupUi();
            }
        },
        closeAddDownloadPopupUi
    );
    showingPopup = true;
}

export function closeAddDownloadPopupUi() {
    document.removeEventListener("mousedown", closeAddDownloadPopupUi);
    document.body.querySelectorAll(`.${AB_DM_POPUP_CLASSNAME}`).forEach((el) => {
        el.remove();
    });
    showingPopup = false;
}

function createUi(position: PositionInPage, onAction: () => void, onCancel: () => void) {
    const el = document.createElement("div");

    // Create shadow root
    const shadowRoot = el.attachShadow({ mode: "open" });
    const downloadSelectedText = browser.i18n.getMessage("selection_popup_download_selected");
    const iconUrl = typeof browser !== "undefined" && browser?.runtime?.getURL 
        ? browser.runtime.getURL("icons/icon-48.png") 
        : "";
    
    // Create style element using textContent to avoid CSP violation
    const styleEl = document.createElement("style");
    styleEl.textContent = `
    .abdm {
        font-family: "JetBrains Mono", "Fira Code", ui-monospace, sans-serif;
        font-size: 12px;
        color: #e6e6e6;
        background: #262626;
        display: flex;
        align-items: stretch;
        flex-direction: row;
        cursor: pointer;
        border-radius: 6px;
        border: 1px solid #000;
        outline: 1px solid #404040;
        overflow: hidden;
        user-select: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    }
    .abdm * {
        transition: all ease 150ms;
        box-sizing: border-box;
    }
    .abdm .download-btn .appIcon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .abdm .download-btn .appIcon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .abdm .download-btn {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        padding: 6px 12px;
        font-weight: 500;
        gap: 6px;
        background: #2b2b2b;
    }
    .abdm .download-btn:hover {
        background: #2f7bf2;
        color: #ffffff;
    }
    .abdm .close-btn {
        background: #353535;
        border-left: 1px solid #404040;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #93939a;
    }
    .abdm .close-btn:hover {
        background: #e5484d;
        color: #ffffff;
    }
    `;
    shadowRoot.appendChild(styleEl);

    // Create HTML content without inline style
    const popupString = `
<div dir="ltr" class="abdm">
    <div class="download-btn">
        <div class="appIcon">
            <img src="${iconUrl}" alt="App Icon"/>
        </div>
        <span>${downloadSelectedText}</span>
    </div>
    <div class="close-btn" title="Close">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="currentColor"/>
        </svg>
    </div>
</div>
    `;

    // Append the popup content to the shadow root
    const container = document.createElement("div");
    container.innerHTML = popupString;
    shadowRoot.appendChild(container.firstElementChild!);

    el.classList.add(AB_DM_POPUP_CLASSNAME);

    el.style.position = "absolute";
    document.body.append(el);

    const elWidth = el.getBoundingClientRect().width;
    const offsetX =
        position.x + elWidth >= window.innerWidth ? window.innerWidth - (elWidth + getScrollbarWidth()) : position.x;
    const offsetY = position.y;

    shadowRoot.querySelector(".download-btn")?.addEventListener("mousedown", (event) => {
        event.stopPropagation();
        onAction();
    });

    shadowRoot.querySelector(".close-btn")?.addEventListener("mousedown", (event) => {
        event.stopPropagation();
        onCancel();
    });

    el.style.zIndex = "9999";
    el.style.top = offsetY + "px";
    el.style.left = offsetX + "px";

    return el;
}

function getScrollbarWidth() {
    return window.innerWidth - document.body.clientWidth;
}
