import React, {ReactNode} from "react";
import "~/assets/css/styles.css"
import {BaseViewModel, useViewModel} from "~/base/BaseViewModel";
import {action, makeObservable, observable} from "mobx";
import {observer} from "mobx-react-lite"
import {run} from "~/utils/ScopeFunctions";
import * as Configs from "~/configs/Config";
import browser from "webextension-polyfill";
import {AppIcon, SettingsIcon} from "~/components/ReactIcons";
import {sendMessage} from "webext-bridge/popup";
import {DefinedCommands} from "~/message/Commands";
import {defineExtensionEntry} from "~/utils/DefineExtensionEntry";
import {createRoot} from "react-dom/client";
import BrowserActionEntryType from "~/utils/EntryPointTypes/BrowserAction/BrowserActionEntryType";

class BrowserActionViewModel extends BaseViewModel {
    private readonly keys: string[]

    constructor(initialStates: Configs.Config) {
        super();
        makeObservable(this)
        this.keys = Object.keys(initialStates)
        this.keys
            .forEach((k) => {
                // @ts-ignore
                this[k] = initialStates[k]
            })
    }

    protected setUp() {
        Configs.onChanged.addEventListener((config) => {
            this.autoCaptureLinks = config.autoCaptureLinks
            this.popupEnabled = config.popupEnabled
            this.silentAddDownload = config.silentAddDownload
        })
        run(async () => {
            const isAppReachable = await sendMessage(
                DefinedCommands.IS_APP_REACHABLE,
                undefined,
                "background",
            )
            this.setCanReachable(isAppReachable)
        })
    }

    @observable
    popupEnabled!: boolean
    @observable
    autoCaptureLinks!: boolean
    @observable
    silentAddDownload!: boolean

    @observable
    canReachable: boolean | null = null

    @action
    setCanReachable(value: boolean) {
        this.canReachable = value
    }

    setAutoCaptureLinks(value: boolean) {
        Configs.setConfigItem("autoCaptureLinks", value)
    }

    setPopupEnabled(value: boolean) {
        Configs.setConfigItem("popupEnabled", value)
    }

    setSilentAddDownload(value: boolean) {
        Configs.setConfigItem("silentAddDownload", value)
    }

}


function MoreSettings() {
    return <OptionItem
        onClick={() => browser.runtime.openOptionsPage()}
        left={
            <div className="flex items-center gap-2 text-xs font-medium text-[#e6e6e6]">
                <SettingsIcon className="w-4 h-4 text-[#93939a]"/>
                <span>{browser.i18n.getMessage("browser_action_more_settings")}</span>
            </div>
        }
        right={
            <span className="text-[#93939a] text-xs">➔</span>
        }
    />
}

function Header(
    props: {
        canReachable: boolean | null
    }
) {
    const reachable = props.canReachable
    const statusBadge = run(() => {
        if (reachable === true) {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#32d74b]/15 text-[#32d74b] text-[11px] font-medium border border-[#32d74b]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#32d74b]"></span>
                    <span>{browser.i18n.getMessage("connection_connected")}</span>
                </div>
            )
        } else if (reachable === false) {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#e5484d]/15 text-[#e5484d] text-[11px] font-medium border border-[#e5484d]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d]"></span>
                    <span>{browser.i18n.getMessage("connection_not_connected")}</span>
                </div>
            )
        } else {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#febc2e]/15 text-[#febc2e] text-[11px] font-medium border border-[#febc2e]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#febc2e] animate-pulse"></span>
                    <span>{browser.i18n.getMessage("connection_checking")}...</span>
                </div>
            )
        }
    })

    return (
        <div className="grabbo-titlebar">
            <div className="flex items-center gap-2.5">
                <AppIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[#e6e6e6] text-xs font-semibold tracking-wide">
                    {browser.i18n.getMessage("browser_action_popup_title")}
                </span>
            </div>
            <div className="flex items-center gap-2.5">
                {statusBadge}
                <div className="grabbo-dots">
                    <span className="grabbo-dot" style={{ background: "#febc2e" }} />
                    <span className="grabbo-dot" style={{ background: "#28c840" }} />
                    <span className="grabbo-dot" style={{ background: "#ff5f57" }} />
                </div>
            </div>
        </div>
    )
}

const BrowserActionUi: React.FC<{
    vm: BrowserActionViewModel
}> = observer((props) => {
    const vm = useViewModel(() => props.vm)
    return (
        <div data-theme="dark" className="w-[320px] bg-[#262626] border border-[#000] shadow-2xl text-[#e6e6e6]">
            <Header canReachable={vm.canReachable}/>
            <div className="bg-[#262626] divide-y divide-[#404040]/60">
                <AutoCaptureSection enabled={vm.autoCaptureLinks} toggle={(v) => vm.setAutoCaptureLinks(v)}/>
                <EnableSection enabled={vm.popupEnabled} toggle={(v) => vm.setPopupEnabled(v)}/>
                <SilentAddDownload enabled={vm.silentAddDownload} toggle={(v) => vm.setSilentAddDownload(v)}/>
                <MoreSettings/>
            </div>
        </div>
    )
})

function Divider() {
    return <div className="w-full bg-[#404040]/60 h-px"/>
}

function OptionItem(
    props: {
        left: ReactNode,
        right: ReactNode,
        onClick?: () => void,
    }
) {
    return (
        <div onClick={props.onClick}
             className="flex flex-row items-center justify-between px-3.5 py-3 hover:bg-[#353535] transition-colors cursor-pointer select-none">
            <div className="text-xs text-[#e6e6e6] font-medium pr-2">
                {props.left}
            </div>
            <div className="flex-shrink-0">
                {props.right}
            </div>
        </div>
    )
}

function EnableSection(
    props: {
        enabled: boolean,
        toggle: (v: boolean) => void
    }
) {
    return <OptionItem
        left={
            <div>{browser.i18n.getMessage("config_show_popups")}</div>
        }
        onClick={
            () => props.toggle(!props.enabled)
        }
        right={
            <input
                checked={props.enabled}
                type="checkbox"
                className="checkbox"/>
        }
    />
}

function SilentAddDownload(
    props: {
        enabled: boolean,
        toggle: (v: boolean) => void
    }
) {
    return <OptionItem
        left={
            <div>{browser.i18n.getMessage("config_silent_add_download")}</div>
        }
        onClick={
            () => props.toggle(!props.enabled)
        }
        right={
            <input
                checked={props.enabled}
                type="checkbox"
                className="checkbox"/>
        }
    />
}

function AutoCaptureSection(
    props: {
        enabled: boolean,
        toggle: (v: boolean) => void
    }
) {
    return <OptionItem
        onClick={
            () => props.toggle(!props.enabled)
        }
        left={
            <div>{browser.i18n.getMessage("config_auto_capture_links")}</div>
        }
        right={
            <input checked={props.enabled} type="checkbox"
                   className="checkbox"/>
        }
    />
}


export default defineExtensionEntry()
    .withType(BrowserActionEntryType)
    .withInit(async (context) => {
        const vm = new BrowserActionViewModel(context.getLatestConfig())
        const container = document.getElementById("app")!
        createRoot(container).render(
            <BrowserActionUi vm={vm}/>,
        )
    })
