import React, { useState, useRef, useEffect } from "react";
import { Resizable } from "re-resizable";
import Editor from "@/components/editor";
import "./index.less";

let prevEditorWidth = "50%";

export default () => {
  const [codes, setCodes] = useState<any>([]);
  const [editorWidth, setEditorWidth] = useState<string>("50%");
  const [displaySandbox, setDisplaySandbox] = useState<boolean>(true);
  const [fullScreenPreview, setFullScreenPreview] = useState<boolean>(false);
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

  const toggleDisplaySandbox = () => {
    if (displaySandbox) {
      // 暂存编辑器宽度
      prevEditorWidth = editorWidth;
    }
    const state = !displaySandbox;
    setEditorWidth(state ? prevEditorWidth : "100%");
    setDisplaySandbox(state);
  };

  const toggleFullScreenPreview = () => {
    if (document.fullscreenElement) {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      // 全屏
      if (displaySandbox) {
        iframeRef.current.requestFullscreen();
      } else {
        document
          .getElementsByClassName("resize-editor-wrapper")[0]
          .requestFullscreen();
      }
    }
  };

  const handleFullScreen = () => {
    setFullScreenPreview(!!document.fullscreenElement);
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullScreen, false);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreen, false);
    };
  }, []);

  return (
    <div className="code-page">
      <Resizable
        className="resize-editor-wrapper"
        size={{
          width: editorWidth,
          height: "100%",
        }}
        minWidth="500px"
        maxWidth={displaySandbox ? "70vw" : "100%"}
        minHeight="100%"
        maxHeight="100%"
        onResizeStop={(e, direction, ref, d) => {
          setEditorWidth(ref.style.width);
        }}
      >
        <Editor
          width="100%"
          height="100%"
          onCodesSave={onCodesSave}
          displaySandbox={displaySandbox}
          fullScreenPreview={fullScreenPreview}
          toggleDisplaySandbox={toggleDisplaySandbox}
          toggleFullScreenPreview={toggleFullScreenPreview}
        />
      </Resizable>

      <iframe
        className="iframe-container"
        style={{ display: displaySandbox ? "block" : "none" }}
        frameBorder={0}
        scrolling="auto"
        ref={iframeRef}
        onLoad={() => {
          // 首次加载，延迟触发更新避免eventListener没有注册
          setTimeout(() => {
            onCodesSave(codes);
          }, 1000);
        }}
        src={`/#/iframe`}
      />
    </div>
  );
};
