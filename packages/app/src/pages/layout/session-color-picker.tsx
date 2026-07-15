import { type JSX, For } from "solid-js"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"
import { MenuV2 } from "@opencode-ai/ui/v2/menu-v2"
import { useLanguage } from "@/context/language"
import { SESSION_COLORS, type SessionColor } from "@/utils/session-metadata"

export function SessionColorPicker(props: {
  children: JSX.Element
  current: SessionColor | undefined
  onSelect: (color: SessionColor | undefined) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const language = useLanguage()
  return (
    <MenuV2
      modal={false}
      placement="bottom-start"
      gutter={4}
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <MenuV2.Trigger as="span" class="inline-flex">
        {props.children}
      </MenuV2.Trigger>
      <MenuV2.Portal>
        <MenuV2.Content class="p-2 min-w-0">
          <div class="flex gap-1.5 flex-wrap max-w-[152px]">
            <For each={SESSION_COLORS}>
              {(color) => (
                <TooltipV2 placement="top" value={color}>
                  <button
                    type="button"
                    class="size-5 rounded-full border-2 transition-transform hover:scale-110"
                    classList={{
                      "border-v2-border-border-strong": props.current === color,
                      "border-transparent": props.current !== color,
                    }}
                    style={{ "background-color": color }}
                    onClick={() => props.onSelect(color === props.current ? undefined : color)}
                  />
                </TooltipV2>
              )}
            </For>
            <TooltipV2 placement="top" value={language.t("common.removeColor")}>
              <button
                type="button"
                class="size-5 rounded-full border-2 border-dashed border-v2-border-border-muted flex items-center justify-center transition-transform hover:scale-110"
                classList={{
                  "border-v2-border-border-strong": props.current === undefined,
                }}
                onClick={() => props.onSelect(undefined)}
              >
                <div class="size-2.5 rounded-full bg-v2-background-bg-layer-02" />
              </button>
            </TooltipV2>
          </div>
        </MenuV2.Content>
      </MenuV2.Portal>
    </MenuV2>
  )
}
