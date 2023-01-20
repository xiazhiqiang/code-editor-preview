import React, { useState, useEffect, useRef } from "react";
import { message, Spin } from "antd";
import storage from "store2";
import loader from "@monaco-editor/loader";
import { normalReactCompCode } from "@/mock/data";
import { cdnPrefix } from "@/constants/index";
import "./index.less";

// 编辑器配置
loader.config({
  paths: {
    vs: `${cdnPrefix}/monaco-editor@0.34.1/min/vs`,
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
    onValueSave = () => {},
  } = props;

  const [editor, setEditor] = useState<any>(null);
  const editorContainerRef = useRef<any>(null);

  useEffect(() => {
    // 从localStorage中取值，如果没有则展示默认的组件代码
    const value = storage.local.get("editor.code") || normalReactCompCode;

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
        // 初始触发更新
        onValueSave(value);
      })
      .catch((err) => {
        console.log("load editor error", err);
      });
  }, []);

  return (
    <div className="editor-container">
      <Spin
        className="loading"
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
