import React, { useState, useRef } from "react";
import storage from "store2";
import Editor from "@/components/editor";
import "./index.less";

export default (props: any) => {
  const [code, setCode] = useState<string>("");
  const iframeRef = useRef<any>(null);

  const onValueSave = (v: string) => {
    storage.local.set("editor.code", v, true);
    setCode(v);

    if (!iframeRef.current) {
      return;
    }
    // 向子页面传递消息
    iframeRef.current.contentWindow.postMessage(
      {
        type: "codeIframe",
        data: v,
      },
      "*"
    );
  };

  return (
    <div className="pageContainer">
      <div className="container">
        <div className="left-container">
          <Editor width="100%" height="100%" onValueSave={onValueSave} />
        </div>
        <div className="right-container">
          <iframe
            className="iframe-container"
            frameBorder={0}
            scrolling="no"
            ref={iframeRef}
            onLoad={() => {
              // 首次加载，延迟触发更新避免eventListener没有注册
              setTimeout(() => {
                onValueSave(code);
              }, 2000);
            }}
            src={`/#/iframe`}
          />
        </div>
      </div>
    </div>
  );
};
