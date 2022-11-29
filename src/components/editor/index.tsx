import React, { useState, useEffect, useMemo, useRef } from "react";
import loader from "@monaco-editor/loader";
import storage from "store2";
import { message } from "antd";
import styles from "./index.module.less";
import { cdn } from "@/constants/index";

loader.config({
  paths: {
    vs: `${cdn}/monaco-editor@0.34.1/min/vs`,
  },
  "vs/nls": {
    availableLanguages: {
      "*": "zh-cn", // on the editor, press right click to see the chinese words
    },
  },
});

export default (props: any) => {
  const {
    editorStyles = {},
    width = "100%",
    height = "100%",
    language = "javascript",
    onCodeSave = () => {},
  } = props;

  const [editor, setEditor] = useState<any>(null);
  const editorContainerRef = useRef<any>(null);
  const value = useMemo(() => {
    return props.value ? props.value : storage.local.get("editor.code") || "";
  }, [props.value]);

  useEffect(() => {
    loader
      .init()
      .then((monaco) => {
        const editor = monaco.editor.create(editorContainerRef.current, {
          value,
          language,
          tabSize: 2,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
          },
          theme: "vs-dark",
          automaticLayout: true,
        });

        // cmd + s 保存
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          // 保存代码到localStorage
          const v = editor.getValue();
          storage.local.set("editor.code", v, true);
          message.success("保存成功！");
          onCodeSave(v);
        });

        setEditor(editor);
      })
      .catch((err) => {
        console.log("load editor error", err);
      });
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setValue(value);
      onCodeSave(value);
    }
  }, [value, editor]);

  return (
    <div className={styles["editor-container"]} style={{ width, height }}>
      {!editor ? <div className={styles.loading}>Loading...</div> : null}
      <div
        style={{ width, height, ...editorStyles }}
        ref={editorContainerRef}
      />
    </div>
  );
};
