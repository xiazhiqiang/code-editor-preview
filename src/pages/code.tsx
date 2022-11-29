import React, { useState } from "react";
import Editor from "../components/editor";
import Sandbox from "@/components/sandbox";
import { normalReactCompCode } from "@/mock/data";
import "./code.less";

export default (props: any) => {
  const [code, setCode] = useState<string>(normalReactCompCode);

  return (
    <div className="pageContainer">
      <h1>示例预览</h1>
      <div className="container">
        <div className="left-container">
          <Editor width="100%" height="100%" onCodeSave={setCode} />
        </div>
        <div className="right-container">
          <Sandbox code={code} />
        </div>
      </div>
    </div>
  );
};
