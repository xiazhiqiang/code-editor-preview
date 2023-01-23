import React, { useState, useRef } from "react";
import Editor from "@/components/editor";
import "./index.less";

export default () => {
  const [codes, setCodes] = useState<any>([]);
  const iframeRef = useRef<any>(null);

  // 向子页面传递消息
  const sendMessage = (msg: any = { type: "", data: null }) => {
    if (!iframeRef.current) {
      return;
    }
    iframeRef.current.contentWindow.postMessage(msg, "*");
  };

  const onCodesSave = (codesArr = []) => {
    setCodes(codesArr);
    sendMessage({ type: "codes", data: codesArr });
  };

  return (
    <div className="pageContainer">
      <div className="container">
        <div className="left-container">
          <Editor width="100%" height="100%" onCodesSave={onCodesSave} />
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
                onCodesSave(codes);
              }, 2000);
            }}
            src={`/#/iframe`}
          />
        </div>
      </div>
    </div>
  );
};
