import React, { useState, useEffect, useMemo, HTMLProps } from "react";

import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";

import styles from "./index.module.scss";

import ResetIcon from "@/app/icons/reload.svg";
import CloseIcon from "@/app/icons/close.svg";
import ClearIcon from "@/app/icons/clear.svg";
import EditIcon from "@/app/icons/edit.svg";
import EyeIcon from "@/app/icons/eye.svg";
import EyeOffIcon from "@/app/icons/eye-off.svg";

import { List, ListItem, Popover, showToast } from "../ui-lib";

import { IconButton } from "../button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  ALL_MODELS,
  useUpdateStore,
  useAccessStore,
  ModalConfigValidator,
} from "../../store";
import { Avatar } from "../chat";

import Locale, { AllLangs, changeLang, getLang } from "../../locales";
import { getCurrentVersion, getEmojiUrl } from "../../utils";
import Link from "next/link";
import { UPDATE_URL } from "../../constant";
import { SearchService, usePromptStore } from "../../store/prompt";
import { requestUsage } from "../../requests";
import { ErrorBoundary } from "../error";
import { InputRange } from "../input-range";

function SettingItem(props: {
  title: string;
  subTitle?: string;
  children: JSX.Element;
  forbidden?: boolean; //是否禁用
}) {
  return (
    <ListItem forbidden={props.forbidden}>
      <div className={styles["settings-title"]}>
        <div>{props.title}</div>
        {props.subTitle && (
          <div className={styles["settings-sub-title"]}>{props.subTitle}</div>
        )}
      </div>
      {props.children}
    </ListItem>
  );
}

function PasswordInput(props: HTMLProps<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  function changeVisibility() {
    setVisible(!visible);
  }

  return (
    <div className={styles["password-input"]}>
      <IconButton
        icon={visible ? <EyeIcon /> : <EyeOffIcon />}
        onClick={changeVisibility}
        className={styles["password-eye"]}
      />
      <input {...props} type={visible ? "text" : "password"} />
    </div>
  );
}

export function Settings(props: { closeSettings: () => void }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [
    config,
    updateConfig,
    resetConfig,
    clearAllData,
    clearSessions,
    isForbiddenHistory,
  ] = useChatStore((state) => [
    state.config,
    state.updateConfig,
    state.resetConfig,
    state.clearAllData,
    state.clearSessions,
    state.config?.openBuildIn,
  ]);
  const updateStore = useUpdateStore();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const currentId = getCurrentVersion();
  const remoteId = updateStore.remoteId;
  const hasNewVersion = currentId !== remoteId;

  function checkUpdate(force = false) {
    setCheckingUpdate(true);
    updateStore.getLatestCommitId(force).then(() => {
      setCheckingUpdate(false);
    });
  }

  const [usage, setUsage] = useState<{
    used?: number;
    subscription?: number;
  }>();
  const [loadingUsage, setLoadingUsage] = useState(false);
  function checkUsage() {
    setLoadingUsage(true);
    requestUsage()
      .then((res) => setUsage(res))
      .finally(() => {
        setLoadingUsage(false);
      });
  }

  const accessStore = useAccessStore();
  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.prompts.size ?? 0;

  const showUsage = !!accessStore.token || !!accessStore.accessCode;

  useEffect(() => {
    checkUpdate();
    showUsage && checkUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.closeSettings();
      }
    };
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //内置知识库改变回调
  const changeInnerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked;
    updateConfig((config) => {
      config.openBuildIn = checked; //开启内置知识库
      if (checked) {
        config.historyMessageCount = 0; //设置携带消息数为0;
      }
    });
  };

  return (
    <ErrorBoundary>
      <div className={styles["window-header"]}>
        <div className={styles["window-header-title"]}>
          <div className={styles["window-header-main-title"]}>
            {Locale.Settings.Title}
          </div>
          <div className={styles["window-header-sub-title"]}>
            {Locale.Settings.SubTitle}
          </div>
        </div>
        <div className={styles["window-actions"]}>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<ClearIcon />}
              onClick={clearSessions}
              bordered
              title={Locale.Settings.Actions.ClearAll}
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<ResetIcon />}
              onClick={resetConfig}
              bordered
              title={Locale.Settings.Actions.ResetAll}
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<CloseIcon />}
              onClick={props.closeSettings}
              bordered
              title={Locale.Settings.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        {/* 字体和主题 */}
        <List>
          <SettingItem title={Locale.Settings.Avatar}>
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <EmojiPicker
                  lazyLoadEmojis
                  theme={EmojiTheme.AUTO}
                  getEmojiUrl={getEmojiUrl}
                  onEmojiClick={(e) => {
                    updateConfig((config) => (config.avatar = e.unified));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                className={styles.avatar}
                onClick={() => setShowEmojiPicker(true)}
              >
                <Avatar role="user" />
              </div>
            </Popover>
          </SettingItem>

          <SettingItem title={Locale.Settings.SendKey}>
            <select
              value={config.submitKey}
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.submitKey = e.target.value as any as SubmitKey),
                );
              }}
            >
              {Object.values(SubmitKey).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </SettingItem>

          <ListItem>
            <div className={styles["settings-title"]}>
              {Locale.Settings.Theme}
            </div>
            <select
              value={config.theme}
              onChange={(e) => {
                updateConfig(
                  (config) => (config.theme = e.target.value as any as Theme),
                );
              }}
            >
              {Object.values(Theme).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </ListItem>

          <SettingItem title={Locale.Settings.Lang.Name}>
            <select
              value={getLang()}
              onChange={(e) => {
                changeLang(e.target.value as any);
              }}
            >
              {AllLangs.map((lang) => (
                <option value={lang} key={lang}>
                  {Locale.Settings.Lang.Options[lang]}
                </option>
              ))}
            </select>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.FontSize.Title}
            subTitle={Locale.Settings.FontSize.SubTitle}
          >
            <InputRange
              title={`${config.fontSize ?? 14}px`}
              value={config.fontSize}
              min="12"
              max="18"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.fontSize = Number.parseInt(e.currentTarget.value)),
                )
              }
            ></InputRange>
          </SettingItem>

          <SettingItem title={Locale.Settings.TightBorder}>
            <input
              type="checkbox"
              checked={config.tightBorder}
              onChange={(e) =>
                updateConfig(
                  (config) => (config.tightBorder = e.currentTarget.checked),
                )
              }
            ></input>
          </SettingItem>
        </List>

        {/* 其他设置(提示词自动补全,自定义提示列表相关) */}
        <List>
          <SettingItem
            title={Locale.Settings.Prompt.Disable.Title}
            subTitle={Locale.Settings.Prompt.Disable.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.disablePromptHint}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.disablePromptHint = e.currentTarget.checked),
                )
              }
            ></input>
          </SettingItem>

          {/* 使用内置知识库 */}
          <SettingItem
            title={Locale.Settings.Prompt.UseBuildIn.Title}
            subTitle={Locale.Settings.Prompt.UseBuildIn.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.openBuildIn}
              onChange={(e) => changeInnerSelect(e)}
            ></input>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.Prompt.List}
            subTitle={Locale.Settings.Prompt.ListCount(
              builtinCount,
              customCount,
            )}
          >
            <IconButton
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => showToast(Locale.WIP)}
            />
          </SettingItem>
        </List>

        {/* 余额和访问限制 */}
        <List>
          {enabledAccessControl ? (
            <SettingItem
              title={Locale.Settings.AccessCode.Title}
              subTitle={Locale.Settings.AccessCode.SubTitle}
            >
              <PasswordInput
                value={accessStore.accessCode}
                type="text"
                placeholder={Locale.Settings.AccessCode.Placeholder}
                onChange={(e) => {
                  accessStore.updateCode(e.currentTarget.value);
                }}
              />
            </SettingItem>
          ) : (
            <></>
          )}

          <SettingItem
            title={Locale.Settings.Token.Title}
            subTitle={Locale.Settings.Token.SubTitle}
          >
            <PasswordInput
              value={accessStore.token}
              type="text"
              placeholder={Locale.Settings.Token.Placeholder}
              onChange={(e) => {
                accessStore.updateToken(e.currentTarget.value);
              }}
            />
          </SettingItem>

          <SettingItem
            title={Locale.Settings.Usage.Title}
            subTitle={
              showUsage
                ? loadingUsage
                  ? Locale.Settings.Usage.IsChecking
                  : Locale.Settings.Usage.SubTitle(
                      usage?.used ?? "[?]",
                      usage?.subscription ?? "[?]",
                    )
                : Locale.Settings.Usage.NoAccess
            }
          >
            {!showUsage || loadingUsage ? (
              <div />
            ) : (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                text={Locale.Settings.Usage.Check}
                onClick={checkUsage}
              />
            )}
          </SettingItem>
          {/* 附带历史消息数量 */}
          <SettingItem
            title={Locale.Settings.HistoryCount.Title}
            subTitle={Locale.Settings.HistoryCount.SubTitle}
            forbidden={isForbiddenHistory}
          >
            <InputRange
              title={config.historyMessageCount.toString()}
              value={config.historyMessageCount}
              min="0"
              max="25"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.historyMessageCount = e.target.valueAsNumber),
                )
              }
            ></InputRange>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.CompressThreshold.Title}
            subTitle={Locale.Settings.CompressThreshold.SubTitle}
          >
            <input
              type="number"
              min={500}
              max={4000}
              value={config.compressMessageLengthThreshold}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.compressMessageLengthThreshold =
                      e.currentTarget.valueAsNumber),
                )
              }
            ></input>
          </SettingItem>
        </List>

        {/* gpt回复随机性 */}
        <List>
          <SettingItem
            title={Locale.Settings.Temperature.Title}
            subTitle={Locale.Settings.Temperature.SubTitle}
          >
            <InputRange
              value={config.modelConfig.temperature?.toFixed(1)}
              min="0"
              max="2"
              step="0.1"
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.modelConfig.temperature =
                      ModalConfigValidator.temperature(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </SettingItem>
          <SettingItem
            title={Locale.Settings.MaxTokens.Title}
            subTitle={Locale.Settings.MaxTokens.SubTitle}
          >
            <input
              type="number"
              min={100}
              max={32000}
              value={config.modelConfig.max_tokens}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.modelConfig.max_tokens =
                      ModalConfigValidator.max_tokens(
                        e.currentTarget.valueAsNumber,
                      )),
                )
              }
            ></input>
          </SettingItem>
          <SettingItem
            title={Locale.Settings.PresencePenlty.Title}
            subTitle={Locale.Settings.PresencePenlty.SubTitle}
          >
            <InputRange
              value={config.modelConfig.presence_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.5"
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.modelConfig.presence_penalty =
                      ModalConfigValidator.presence_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </SettingItem>
        </List>
      </div>
    </ErrorBoundary>
  );
}
