import React, { useEffect, useState } from "react";
import storage from "store2";
import Editor from "@/components/editor";
import Sandbox from "@/components/sandbox";
import ErrorBoundary from "@/components/errorBoundary";
import { normalReactCompCode } from "@/mock/data";
import "./code.less";

export default (props: any) => {
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    if (!code) {
      const val = storage.local.get("editor.code") || normalReactCompCode;
      setCode(val);
    }
  }, []);

  const onValueSave = (v: string) => {
    storage.local.set("editor.code", v, true);
    setCode(v);
  };

  return (
    <ErrorBoundary>
      <div className="pageContainer">
        <h1>示例预览</h1>
        <div className="container">
          <div className="left-container">
            <Editor
              width="100%"
              height="100%"
              value={code}
              onValueSave={onValueSave}
            />
          </div>
          <div className="right-container">
            <Sandbox code={code} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
