import React, { useState, useEffect, useRef } from "react";
import loader from "@monaco-editor/loader";
import { message, Spin } from "antd";
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
    value = "",
    editorStyles = {},
    width = "100%",
    height = "100%",
    language = "javascript",
    onValueSave = () => {},
  } = props;

  const [editor, setEditor] = useState<any>(null);
  const editorContainerRef = useRef<any>(null);

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
          message.destroy("editorSave");
          message.success({
            content: "代码已保存！",
            key: "editorSave",
            style: {
              marginTop: "30vh",
            },
          });
          onValueSave(v);
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
    }
  }, [value, editor]);

  return (
    <div className={styles["editor-container"]}>
      <Spin
        className={styles.loading}
        spinning={!editor}
        tip="Loading..."
        size="large"
      />
      <div
        style={{ width, height, ...editorStyles }}
        ref={editorContainerRef}
      />
    </div>
  );
};
